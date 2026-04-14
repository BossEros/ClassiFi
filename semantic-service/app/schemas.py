from typing import Literal

from pydantic import BaseModel

SupportedLanguage = Literal["python", "java", "c"]


class SimilarityRequest(BaseModel):
    code1: str
    code2: str
    language: SupportedLanguage | None = None


class SimilarityResponse(BaseModel):
    score: float


class EmbedRequest(BaseModel):
    code: str
    language: SupportedLanguage | None = None


class EmbedResponse(BaseModel):
    embedding: list[float]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
