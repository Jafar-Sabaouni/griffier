from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from griffier.config import Settings, get_settings


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"


def create_app(settings: Settings | None = None) -> FastAPI:
    active_settings = settings if settings is not None else get_settings()
    application = FastAPI(title="Griffier API", version="0.1.0")

    application.add_middleware(
        CORSMiddleware,
        allow_origins=active_settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.get("/api/health", tags=["health"])
    def health_check() -> HealthResponse:
        return HealthResponse()

    return application


app = create_app()
