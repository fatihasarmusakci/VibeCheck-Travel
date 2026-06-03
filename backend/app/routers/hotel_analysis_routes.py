from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from app.schemas.hotel_analysis import HotelAnalysisRequest, HotelAnalysisResponse
from app.services.hotel_analysis_service import HotelAnalysisService

router = APIRouter(prefix="/api/hotels", tags=["hotel-analysis"])

# Service instance (singleton pattern)
_service = HotelAnalysisService()


@router.post("/analyze", response_model=HotelAnalysisResponse)
async def analyze_hotel_reviews(request: HotelAnalysisRequest) -> dict[str, Any]:
    """
    Otel yorumlarını AI ile analiz eder.
    
    Bu endpoint:
    - Frontend'den gelen yorum listesini alır
    - HotelAnalysisService kullanarak analiz eder
    - Temizlik skoru, çocuk parkı durumu, sessizlik skoru, pros ve cons döner
    
    Args:
        request: Otel yorumlarını içeren request body
        
    Returns:
        Analiz sonucu JSON formatında
    """
    result = _service.analyze_reviews(request.reviews)
    return result
