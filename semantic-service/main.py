import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from app.predictor import predictor
from app.schemas import EmbedRequest, EmbedResponse, HealthResponse, SimilarityRequest, SimilarityResponse

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    predictor.load()
    yield


app = FastAPI(
    title="ClassiFi Semantic Similarity Service",
    description="GraphCodeBERT-powered semantic code similarity scoring.",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health() -> HealthResponse:
    """Health check endpoint for Docker and orchestration probes."""
    return HealthResponse(status="ok", model_loaded=predictor.is_loaded)


@app.post("/similarity", response_model=SimilarityResponse, tags=["Similarity"])
async def compute_similarity(request: SimilarityRequest) -> SimilarityResponse:
    """
    Compute the semantic similarity score for a pair of Python code submissions.

    Returns a score in [0.0, 1.0] representing the model's confidence that
    the two submissions are semantically similar (plagiarised).
    """
    try:
        score = predictor.compute_similarity(request.code1, request.code2)

        return SimilarityResponse(score=score)
    except Exception as exc:
        logger.exception("Inference failed: %s", exc)
        raise HTTPException(status_code=500, detail="Model inference failed.") from exc


@app.post("/embed", response_model=EmbedResponse, tags=["Embedding"])
async def embed_code(request: EmbedRequest) -> EmbedResponse:
    """
    Return the 768-dimensional CLS embedding for a single code snippet.

    Clients can cache embeddings per-submission and compute pairwise cosine
    similarity locally, reducing model forward passes from O(n²) to O(n).
    """
    try:
        embedding = predictor.embed(request.code)

        return EmbedResponse(embedding=embedding)
    except Exception as exc:
        logger.exception("Embedding failed: %s", exc)
        raise HTTPException(status_code=500, detail="Model embedding failed.") from exc
