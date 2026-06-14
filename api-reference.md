# Backend API — AI Agent Reference

FastAPI backend for Velo/VibeCheck. Base URL: `http://localhost:8000` (dev) or Render URL (prod).

## Health

```
GET /health → { "status": "ok", "service": "vibecheck-api" }
```

## Hotel Analysis (Core AI — Gemini)

```
POST /api/hotels/analyze
Content-Type: application/json

{
  "reviews": ["Oda temizdi ama çocuk parkı küçüktü."]
}

→ {
  "hotel_analysis": {
    "cleanliness": { "score": 9.5, "summary": "..." },
    "family_friendly": { "score": 4.2, "summary": "..." },
    "food_quality": { "score": 8.8, "summary": "..." },
    "location": { "score": 7.0, "summary": "..." },
    "service": { "score": 8.2, "summary": "..." },
    "value_for_money": { "score": 8.5, "summary": "..." }
  }
}
```

Requires `GEMINI_API_KEY` for live LLM; falls back to heuristic without key.

## Hotels

```
GET /hotels?city=london
GET /hotels/{hotel_id}/smart-score?user_id=...&persist=false
GET /hotels/{hotel_id}/summary
GET /hotels/{hotel_id}/tldr
GET /hotels/{hotel_id}/truth
GET /hotels/{hotel_id}/visual-honesty
```

## Reviews (OpenAI NLP via Celery)

```
POST /reviews
{ "hotel_id": "...", "raw_text": "...", "source": "booking" }
```

## Users

```
POST /users — create with persona_data
GET /users/{user_id}
```

## Engagement

```
GET /vibe-map?city=london&layers=quiet,metro
POST /game/guess
GET /insights/daily?city=london
POST /staycation/rating
```

## Environment

See root `.env.example` and `backend/.env.example`.

## Code Layout

```
backend/app/
  routers/     — HTTP endpoints
  services/    — Business logic + AI (hotel_analysis_service, nlp_service, summarization_service)
  models/      — SQLAlchemy ORM
  schemas/     — Pydantic request/response
  workers/     — Celery tasks
  core/        — config, middleware, exceptions
```

## Testing

```bash
cd backend && python -m pytest
```
