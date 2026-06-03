from __future__ import annotations

import json
import logging
from typing import Any

import google.generativeai as genai

from app.core.config import settings

logger = logging.getLogger(__name__)

# ============================================================================
# PROMPT TEMPLATES (Gerçek API bağlandığında kullanılacak taslaklar)
# ============================================================================

# System Prompt: LLM'in rolünü ve görevini tanımlar
_SYSTEM_PROMPT = """Sen bir otel yorumu analizi uzmanısın. Verilen otel yorumlarını analiz ederek aşağıdaki kriterlere göre yapılandırılmış bir JSON döndür.

Görevin:
1. Temizlik durumunu 1-5 arası puanla (1: çok kötü, 5: mükemmel)
2. Otelin çocuk parkı/oyun alanı olup olmadığını tespit et (boolean)
3. Otelin sessizlik durumunu 1-5 arası puanla (1: çok gürültülü, 5: çok sessiz)
4. Yorumlardaki olumlu özellikleri pros listesine ekle
5. Yorumlardaki olumsuz özellikleri cons listesine ekle

Çıktı formatı (tam olarak bu JSON yapısı):
{
  "cleaning_score": 1-5 arası integer,
  "has_playground": boolean,
  "quietness_score": 1-5 arası integer,
  "pros": ["öne çıkan olumlu özellik 1", "öne çıkan olumlu özellik 2", ...],
  "cons": ["olumsuz özellik 1", "olumsuz özellik 2", ...]
}

Kurallar:
- Sadece geçerli JSON döndür, başka metin ekleme
- cleaning_score ve quietness_score mutlaka 1-5 arası integer olmalı
- pros ve cons listeleri boş olabilir ama en az 3-5 madde eklemeye çalış
- has_playground: çocuk parkı, oyun alanı, kids club vb. varsa true
- Türkçe veya İngilizce yorumları analiz edebilmelisin
"""

# User Prompt Template: Kullanıcı yorumlarını LLM'e gönderirken kullanılacak
_USER_PROMPT_TEMPLATE = """Aşağıdaki otel yorumlarını analiz et:

{reviews_text}

Yukarıdaki yorumlara göre JSON formatında analiz sonucunu döndür."""


# ============================================================================
# HOTEL ANALYSIS SERVICE
# ============================================================================

class HotelAnalysisService:
    """Otel yorum analizi servisi - Google Gemini API kullanır."""

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        """
        Servisi başlat.

        Args:
            api_key: Google Gemini API key (None ise mock mod çalışır)
            model: Kullanılacak model (None ise settings'ten alır)
        """
        self._model = model or settings.gemini_model
        key = api_key if api_key is not None else settings.gemini_api_key
        # API key yoksa mock mod çalışır
        self._use_mock = key is None
        if not self._use_mock:
            genai.configure(api_key=key)
            self._model_client = genai.GenerativeModel(self._model)
        else:
            logger.info("No Gemini API key provided, using mock mode")

    def analyze_reviews(self, reviews: list[str]) -> dict[str, Any]:
        """
        Otel yorumlarını analiz et.

        Args:
            reviews: Ham otel yorumları listesi (text array)

        Returns:
            {
                "cleaning_score": 1-5,
                "has_playground": boolean,
                "quietness_score": 1-5,
                "pros": ["string", ...],
                "cons": ["string", ...]
            }
        """
        if self._use_mock:
            logger.info("Using mock mode for hotel analysis (no API key)")
            return self._mock_analyze_reviews(reviews)

        # Gerçek API çağrısı (API key varsa)
        return self._real_api_analyze_reviews(reviews)

    def _real_api_analyze_reviews(self, reviews: list[str]) -> dict[str, Any]:
        """
        Gerçek Google Gemini API çağrısı.
        """
        try:
            # Yorumları tek metne birleştir
            reviews_text = "\n---\n".join(reviews)

            # Gemini API çağrısı
            response = self._model_client.generate_content(
                [
                    {"role": "user", "parts": [{"text": _SYSTEM_PROMPT}]},
                    {
                        "role": "user",
                        "parts": [
                            {
                                "text": _USER_PROMPT_TEMPLATE.format(
                                    reviews_text=reviews_text[:12_000]
                                )
                            }
                        ],
                    },
                ],
                generation_config=genai.GenerationConfig(
                    temperature=0.2,
                    response_mime_type="application/json",
                ),
            )

            content = response.text or "{}"
            data = json.loads(content)

            # Veri validasyonu
            result = {
                "cleaning_score": self._validate_score(data.get("cleaning_score", 3)),
                "has_playground": bool(data.get("has_playground", False)),
                "quietness_score": self._validate_score(data.get("quietness_score", 3)),
                "pros": self._validate_list(data.get("pros", [])),
                "cons": self._validate_list(data.get("cons", [])),
            }

            return result

        except Exception as exc:  # noqa: BLE001
            logger.warning("Gemini API failed, falling back to mock: %s", exc)
            return self._mock_analyze_reviews(reviews)

    def _mock_analyze_reviews(self, reviews: list[str]) -> dict[str, Any]:
        """
        Mock analiz fonksiyonu - Gerçek API olmadığında çalışır.
        
        Hardcoded JSON döner ama gerçek bir analiz yapıyormuş gibi davranır.
        İleride API key alındığında sadece bu fonksiyon yerine _real_api_analyze_reviews
        çağrılacak.
        """
        # Tüm yorumları birleştir ve analiz et
        all_text = " ".join(reviews).lower()
        
        # Heuristik analiz (basit keyword matching)
        cleaning_keywords = ["temiz", "clean", "kirli", "dirty", "küf", "mold", "hygiene"]
        playground_keywords = ["çocuk parkı", "playground", "oyun alanı", "kids club", "children", "kids"]
        quiet_keywords = ["sessiz", "quiet", "gürültü", "noise", "loud", "sakin", "peaceful"]
        
        # Temizlik skoru hesapla
        clean_positive = sum(1 for kw in ["temiz", "clean", "hygiene"] if kw in all_text)
        clean_negative = sum(1 for kw in ["kirli", "dirty", "küf", "mold"] if kw in all_text)
        cleaning_score = max(1, min(5, 3 + clean_positive - clean_negative))
        
        # Playground var mı?
        has_playground = any(kw in all_text for kw in playground_keywords)
        
        # Sessizlik skoru hesapla
        quiet_positive = sum(1 for kw in ["sessiz", "quiet", "sakin", "peaceful"] if kw in all_text)
        quiet_negative = sum(1 for kw in ["gürültü", "noise", "loud"] if kw in all_text)
        quietness_score = max(1, min(5, 3 + quiet_positive - quiet_negative))
        
        # Pros ve Cons çıkar
        pros = []
        cons = []
        
        # Olumlu özellikler
        if "temiz" in all_text or "clean" in all_text:
            pros.append("Temizlik konusunda olumlu")
        if "personel" in all_text or "staff" in all_text:
            pros.append("Personel ilgili ve yardımsever")
        if "konum" in all_text or "location" in all_text or "merkez" in all_text:
            pros.append("İyi konum")
        if "fiyat" in all_text or "price" in all_text or "uygun" in all_text:
            pros.append("Fiyat/performans uygun")
        if has_playground:
            pros.append("Çocuklar için oyun alanı mevcut")
        if "kahvaltı" in all_text or "breakfast" in all_text:
            pros.append("Kahvalti iyi")
        
        # Olumsuz özellikler
        if "kirli" in all_text or "dirty" in all_text:
            cons.append("Temizlik sorunları var")
        if "gürültü" in all_text or "noise" in all_text or "loud" in all_text:
            cons.append("Gürültü problemi")
        if "personel" in all_text and ("kaba" in all_text or "ilgisiz" in all_text):
            cons.append("Personel ilgisiz")
        if "yatak" in all_text and ("rahat değil" in all_text or "uncomfortable" in all_text):
            cons.append("Yataklar rahat değil")
        if "wifi" in all_text and ("yavaş" in all_text or "slow" in all_text or "çalışmıyor" in all_text):
            cons.append("WiFi sorunları")
        
        # Eğer pros/cons boşsa varsayılan değerler ekle
        if not pros:
            pros = ["Genel olarak olumlu yorumlar"]
        if not cons:
            cons = ["Belirgin olumsuzluk yok"]
        
        return {
            "cleaning_score": cleaning_score,
            "has_playground": has_playground,
            "quietness_score": quietness_score,
            "pros": pros,
            "cons": cons,
        }

    def _validate_score(self, value: Any) -> int:
        """Skor değerini 1-5 arasına validate et."""
        try:
            score = int(value)
            return max(1, min(5, score))
        except (ValueError, TypeError):
            return 3  # Varsayılan orta değer

    def _validate_list(self, value: Any) -> list[str]:
        """Liste değerini validate et."""
        if isinstance(value, list):
            return [str(item) for item in value if item]
        return []


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def create_hotel_analysis_service(api_key: str | None = None) -> HotelAnalysisService:
    """
    Factory function - HotelAnalysisService örneği oluşturur.

    Args:
        api_key: Google Gemini API key (None ise mock mod çalışır)

    Returns:
        HotelAnalysisService instance
    """
    return HotelAnalysisService(api_key=api_key)
