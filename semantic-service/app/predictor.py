import logging

import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import RobertaConfig, RobertaForSequenceClassification, RobertaTokenizer

from app.config import settings
from app.dfg_features import (
    EPSILON,
    SUPPORTED_LANGUAGES,
    build_attn_mask,
    convert_code_to_features,
    get_parsers,
)

logger = logging.getLogger(__name__)

BASE_MODEL_NAME = "microsoft/graphcodebert-base"


class _ClassificationHead(nn.Module):
    """
    Classification head matching the fine-tuned checkpoint structure.

    This class is NOT used during inference (we use cosine similarity of CLS
    embeddings instead), but its parameters MUST exist in `_ModelWrapper` so
    that `load_state_dict()` can load the checkpoint keys that reference
    `classifier.dense.*` and `classifier.out_proj.*`.
    """

    def __init__(self, hidden_size: int, hidden_dropout_prob: float) -> None:
        super().__init__()
        self.dense = nn.Linear(hidden_size * 2, hidden_size)
        self.dropout = nn.Dropout(hidden_dropout_prob)
        self.out_proj = nn.Linear(hidden_size, 2)

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        x = self.dropout(features)
        x = self.dense(x)
        x = torch.tanh(x)
        x = self.dropout(x)

        return self.out_proj(x)


class _ModelWrapper(nn.Module):
    """
    Reconstructed model class matching the state-dict produced by fine-tuning.

    Architecture (from checkpoint key prefixes):
      self.encoder    — RobertaForSequenceClassification(num_labels=1)
      self.classifier — _ClassificationHead (kept for state_dict compatibility)

    Inference only uses self.encoder.roberta to extract CLS embeddings,
    then computes cosine similarity — the classifier head is never invoked.
    """

    def __init__(
        self,
        encoder: RobertaForSequenceClassification,
        hidden_size: int,
        hidden_dropout_prob: float,
    ) -> None:
        super().__init__()
        self.encoder = encoder
        self.classifier = _ClassificationHead(hidden_size, hidden_dropout_prob)


class Predictor:
    """
    Singleton responsible for loading the GraphCodeBERT model and running inference.

    Supports semantic similarity scoring for Python, Java, and C source code.
    GraphCodeBERT was pre-trained on code from six languages and produces
    meaningful CLS embeddings for all three target languages.

    Loading is deferred to `load()` so the FastAPI lifespan hook controls
    when the heavy initialisation occurs (once at startup, not at import time).
    """

    def __init__(self) -> None:
        self._model: _ModelWrapper | None = None
        self._tokenizer: RobertaTokenizer | None = None

    def load(self) -> None:
        """Load the tokenizer and fine-tuned model weights into memory."""
        logger.info("Loading tokenizer from %s", BASE_MODEL_NAME)
        self._tokenizer = RobertaTokenizer.from_pretrained(BASE_MODEL_NAME)

        logger.info("Building model skeleton from config")
        config = RobertaConfig.from_pretrained(BASE_MODEL_NAME, num_labels=1)
        # Force eager attention so the custom 3D graph-guided attention mask
        # used by DFG-augmented encoding is applied correctly by each layer.
        config._attn_implementation = "eager"
        backbone = RobertaForSequenceClassification(config)
        wrapper = _ModelWrapper(backbone, config.hidden_size, config.hidden_dropout_prob)

        logger.info("Loading fine-tuned weights from %s", settings.model_path)
        state_dict = torch.load(
            settings.model_path,
            map_location="cpu",
            weights_only=False,
        )
        # strict=False allows loading checkpoints that were saved without the
        # classifier head (e.g. encoder-only exports from the training notebook).
        # Missing classifier keys are intentional — the head is never invoked
        # at inference; we only use encoder.roberta for CLS embeddings.
        wrapper.load_state_dict(state_dict, strict=False)
        wrapper.eval()

        self._model = wrapper
        logger.info("Model ready — inference available")

        # Warm up the DFG parser cache at startup so the first request is fast.
        try:
            get_parsers()
        except Exception:
            pass

    @property
    def is_loaded(self) -> bool:
        return self._model is not None and self._tokenizer is not None

    def compute_similarity(self, code1: str, code2: str, language: str | None = None) -> float:
        """
        Return a similarity score in [0.0, 1.0] between two code snippets.

        When ``language`` is provided and tree-sitter-languages is installed,
        encoding uses DFG-augmented graph-guided attention masks (matching the
        training-time forward pass).  If DFG extraction fails for any reason,
        the method falls back to vanilla tokenisation transparently.

        Supports Python, Java, and C source code.  GraphCodeBERT was
        pre-trained on six programming languages (including Python and Java)
        and produces meaningful token-level representations for all of them.
        The fine-tuning phase further specialised the model for clone
        detection across these languages.

        Cosine similarity naturally returns 1.0 for identical inputs and
        produces a well-distributed, continuous score range — more intuitive
        than the narrow softmax probabilities from the classification head.
        """
        if not self.is_loaded:
            raise RuntimeError("Model has not been loaded yet.")

        vec1 = self._encode(code1, language)
        vec2 = self._encode(code2, language)

        similarity = F.cosine_similarity(vec1, vec2).item()

        # Clamp to [0, 1] — negative cosine values mean "completely unrelated",
        # which we represent as 0 for a plagiarism score context.
        score = max(0.0, similarity)

        return round(score, 4)

    def embed(self, code: str, language: str | None = None) -> list[float]:
        """
        Return the CLS embedding as a flat list of floats.

        When ``language`` is provided, encoding uses DFG-augmented attention
        masks matching the training forward pass.  Falls back to vanilla
        tokenisation if DFG extraction is unavailable or fails.

        Clients can cache embeddings per-submission and compute pairwise cosine
        similarity locally, reducing model forward passes from O(n²) to O(n).
        """
        if not self.is_loaded:
            raise RuntimeError("Model has not been loaded yet.")

        vec = self._encode(code, language)

        return vec.squeeze(0).tolist()

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _encode(self, code: str, language: str | None = None) -> torch.Tensor:
        """
        Tokenise a single code snippet and return its CLS embedding (1, 768).

        When ``language`` is a supported language and tree-sitter-languages is
        available, uses DFG-augmented encoding to match the training forward
        pass.  Transparently falls back to vanilla tokenisation otherwise.
        """
        if language in SUPPORTED_LANGUAGES:
            try:
                return self._encode_with_dfg(code, language)
            except Exception as exc:
                logger.warning(
                    "DFG encoding failed for language '%s' (%s) — using vanilla fallback",
                    language, exc,
                )

        return self._encode_vanilla(code)

    def _encode_vanilla(self, code: str) -> torch.Tensor:
        """
        Vanilla tokenisation path: one standard RobertaTokenizer call, CLS token.
        Used when language is unknown or DFG extraction is unavailable.
        """
        inputs = self._tokenizer(
            code,
            return_tensors="pt",
            truncation=True,
            max_length=settings.max_token_length,
            padding=True,
        )

        with torch.no_grad():
            outputs = self._model.encoder.roberta(**inputs)

        # outputs[0] is (batch, seq_len, hidden) — take CLS token at position 0
        return outputs[0][:, 0, :]

    def _encode_with_dfg(self, code: str, language: str) -> torch.Tensor:
        """
        DFG-augmented encoding that replicates the training-time Model.forward().

        Steps:
          1. Extract DFG edges and convert snippet to position-indexed features.
          2. Build the graph-guided 3D attention mask.
          3. Average code-token embeddings into DFG node positions (einsum).
          4. Run the roberta.embeddings + roberta.encoder pipeline directly,
             injecting the custom DFG-enriched embeddings and 3D attention mask.
          5. Return the CLS embedding (1, 768).
        """
        features = convert_code_to_features(code, language, self._tokenizer)

        inputs_ids_t = torch.tensor([features["source_ids"]], dtype=torch.long)
        position_idx_t = torch.tensor([features["position_idx"]], dtype=torch.long)
        attn_mask_np = build_attn_mask(
            features["position_idx"],
            features["source_ids"],
            features["dfg_to_code"],
            features["dfg_to_dfg"],
        )
        attn_mask_t = torch.from_numpy(attn_mask_np).unsqueeze(0)  # [1, L, L]

        roberta = self._model.encoder.roberta

        with torch.no_grad():
            # Step 1 — word embeddings for the full sequence (code + DFG placeholders)
            inputs_embeddings = roberta.embeddings.word_embeddings(inputs_ids_t)

            # Step 2 — average attending code-token embeddings into DFG node positions
            nodes_mask = position_idx_t.eq(0)          # [1, L]  DFG nodes
            token_mask = position_idx_t.ge(2)          # [1, L]  code tokens
            nodes_to_token_mask = (
                nodes_mask[:, :, None] & token_mask[:, None, :] & attn_mask_t
            ).float()
            normaliser = (nodes_to_token_mask.sum(-1, keepdim=True) + EPSILON)
            nodes_to_token_mask = nodes_to_token_mask / normaliser
            avg_embeddings = torch.einsum("abc,acd->abd", nodes_to_token_mask, inputs_embeddings)
            inputs_embeddings = (
                inputs_embeddings * (~nodes_mask)[:, :, None]
                + avg_embeddings  *   nodes_mask [:, :, None]
            )

            # Step 3 — position + token-type embeddings (via roberta.embeddings)
            embedding_output = roberta.embeddings(
                input_ids=None,
                position_ids=position_idx_t,
                token_type_ids=position_idx_t.eq(-1).long(),
                inputs_embeds=inputs_embeddings,
            )

            # Step 4 — convert 3D bool mask → 4D float additive mask and run encoder
            extended_attn_mask = attn_mask_t[:, None, :, :].to(dtype=embedding_output.dtype)
            extended_attn_mask = (1.0 - extended_attn_mask) * torch.finfo(embedding_output.dtype).min

            outputs = roberta.encoder(
                embedding_output,
                attention_mask=extended_attn_mask,
            )[0]

        # Step 5 — return CLS embedding
        return outputs[:, 0, :]


# Module-level singleton — imported and used by main.py
predictor = Predictor()
