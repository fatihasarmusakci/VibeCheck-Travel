from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import settings
from app.core.error_handlers import register_exception_handlers
from app.core.middleware import ErrorHandlingMiddleware
from app.db.session import AsyncSessionLocal, init_db
from app.routers.engagement_routes import router as engagement_router
from app.routers.hotel_analysis_routes import router as hotel_analysis_router
from app.routers.hotels_routes import router as hotels_router
from app.routers.reviews_routes import router as reviews_router
from app.routers.users_routes import router as users_router
from app.routers.vibe_map_routes import router as vibe_map_router
from app.schemas.api import HealthResponse
from app.seed_bootstrap import seed_demo_if_empty


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db()
    async with AsyncSessionLocal() as session:
        await seed_demo_if_empty(session)
    yield


app = FastAPI(
    title=settings.app_name,
    description="VibeCheck AI — seyahat asistanı ve Smart-Scoring motoru.",
    version="1.0.0",
    lifespan=lifespan,
)
app.debug = settings.debug

app.add_middleware(ErrorHandlingMiddleware)
register_exception_handlers(app)


@app.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok", service="vibecheck-api")


app.include_router(hotels_router)
app.include_router(users_router)
app.include_router(reviews_router)
app.include_router(vibe_map_router)
app.include_router(engagement_router)
app.include_router(hotel_analysis_router)
