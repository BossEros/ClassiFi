import logging

import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import RobertaConfig, RobertaForSequenceClassification, RobertaTokenizer

from app.config import settings

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
        backbone = RobertaForSequenceClassification(config)
        wrapper = _ModelWrapper(backbone, config.hidden_size, config.hidden_dropout_prob)

        logger.info("Loading fine-tuned weights from %s", settings.model_path)
        state_dict = torch.load(
            settings.model_path,
            map_location="cpu",
            weights_only=False,
        )
        wrapper.load_state_dict(state_dict)
        wrapper.eval()

        self._model = wrapper
        logger.info("Model ready — inference available")

    @property
    def is_loaded(self) -> bool:
        return self._model is not None and self._tokenizer is not None

    def compute_similarity(self, code1: str, code2: str) -> float:
        """
        Return a similarity score in [0.0, 1.0] between two code snippets.

        Each snippet is encoded independently by the fine-tuned GraphCodeBERT
        encoder.  The score is the cosine similarity between their CLS token
        embeddings, clamped to [0, 1].

        Cosine similarity naturally returns 1.0 for identical inputs and
        produces a well-distributed, continuous score range — more intuitive
        than the narrow softmax probabilities from the classification head.
        """
        if not self.is_loaded:
            raise RuntimeError("Model has not been loaded yet.")

        vec1 = self._encode(code1)
        vec2 = self._encode(code2)

        similarity = F.cosine_similarity(vec1, vec2).item()

        # Clamp to [0, 1] — negative cosine values mean "completely unrelated",
        # which we represent as 0 for a plagiarism score context.
        score = max(0.0, similarity)

        return round(score, 4)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _encode(self, code: str) -> torch.Tensor:
        """
        Tokenise a single code snippet and return its CLS embedding (1, 768).
        Truncation is applied per-snippet so each gets the full token budget.
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


# Module-level singleton — imported and used by main.py
predictor = Predictor()
