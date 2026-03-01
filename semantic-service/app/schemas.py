from pydantic import BaseModel


class SimilarityRequest(BaseModel):
    code1: str
    code2: str


class SimilarityResponse(BaseModel):
    score: float


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
