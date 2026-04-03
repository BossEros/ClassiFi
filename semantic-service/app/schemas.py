from pydantic import BaseModel


class SimilarityRequest(BaseModel):
    code1: str
    code2: str


class SimilarityResponse(BaseModel):
    score: float


class EmbedRequest(BaseModel):
    code: str


class EmbedResponse(BaseModel):
    embedding: list[float]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
