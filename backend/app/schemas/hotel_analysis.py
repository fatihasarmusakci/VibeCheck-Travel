from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class HotelAnalysisRequest(BaseModel):
    """Otel yorum analizi request modeli."""

    reviews: list[str] = Field(
        ...,
        min_length=1,
        description="Analiz edilecek otel yorumları listesi",
    )


class HotelAnalysisResponse(BaseModel):
    """Otel yorum analizi response modeli."""

    cleaning_score: int = Field(
        ...,
        ge=1,
        le=5,
        description="Temizlik skoru (1-5 arası)",
    )
    has_playground: bool = Field(
        ...,
        description="Otelde çocuk parkı/oyun alanı var mı?",
    )
    quietness_score: int = Field(
        ...,
        ge=1,
        le=5,
        description="Sessizlik skoru (1-5 arası)",
    )
    pros: list[str] = Field(
        ...,
        description="Otelin olumlu özellikleri",
    )
    cons: list[str] = Field(
        ...,
        description="Otelin olumsuz özellikleri",
    )
