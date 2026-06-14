# Architecture — AI Agent Reference

## System Overview

Velo/VibeCheck is a split-stack travel decision app:

1. **Velo** — Paste hotel reviews → Gemini analyzes 6 criteria → scored UI cards
2. **VibeCheck** — Prototype flows: persona, truth dashboard, vibe-map, retention hooks

## Request Flow (Velo Analysis)

```
User → HotelAnalysisCard.tsx
     → hotelAnalysisService.ts (fetch)
     → POST /api/hotels/analyze
     → hotel_analysis_routes.py
     → HotelAnalysisService.analyze_reviews()
     → Google Gemini API (or heuristic fallback)
     → JSON response → React state → UI
```

## Request Flow (Review NLP)

```
POST /reviews → reviews_routes.py
             → Celery task reviews.analyze_review
             → NLPService (OpenAI)
             → DB update (sentiment_scores)
```

## AI Services Map

| Service | File | LLM | Trigger |
|---------|------|-----|---------|
| Hotel batch analysis | `hotel_analysis_service.py` | Gemini | User clicks "Analiz Et" |
| Single review NLP | `nlp_service.py` | OpenAI | POST /reviews |
| Hotel summary | `summarization_service.py` | OpenAI | GET /summary, /tldr |
| Visual honesty | `honesty_service.py` | Heuristic | GET /visual-honesty |

## Frontend Data Modes

- `VITE_DATA_SOURCE=mock` → `vibecheck-mock-service.ts`
- `VITE_DATA_SOURCE=live` → `vibecheck-live-service.ts` → backend APIs

Velo card always calls live `/api/hotels/analyze` via `VITE_API_BASE_URL`.

## Deploy Topology

```
Vercel (frontend SPA)
    ↓ HTTPS
Render (FastAPI + uvicorn)
    ↓
Gemini API / OpenAI API
    ↓
SQLite or PostgreSQL
```

## CORS

Backend reads `CORS_ORIGINS` (comma-separated). Set to Vercel URL in production.

## Key Constraints

- Never commit `.env` with real API keys
- Gemini returns JSON via `response_mime_type=application/json`
- Scores are 1–10 floats; null allowed when no signal in reviews

## Related Docs

- `PRD.md` — product requirements
- `tech-stack.md` — technology choices
- `prodocs/api-reference.md` — endpoint list
