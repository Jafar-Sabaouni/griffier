from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from griffier.adapters.storage.in_memory import InMemoryInterviewRepository
from griffier.adapters.storage.in_memory_audio import InMemoryAudioStore
from griffier.api.errors import register_exception_handlers
from griffier.api.routes.interviews import router as interviews_router
from griffier.config import Settings, get_settings


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"


def create_app(settings: Settings | None = None) -> FastAPI:
    active_settings = settings if settings is not None else get_settings()
    application = FastAPI(title="Griffier API", version="0.1.0")

    application.state.settings = active_settings
    application.state.interview_repository = InMemoryInterviewRepository()
    application.state.audio_store = InMemoryAudioStore()

    application.add_middleware(
        CORSMiddleware,
        allow_origins=active_settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(application)
    application.include_router(interviews_router)

    @application.get("/api/health", tags=["health"])
    def health_check() -> HealthResponse:
        return HealthResponse()

    return application


app = create_app()
