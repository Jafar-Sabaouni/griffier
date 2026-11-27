from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from griffier.domain.errors import (
    AudioNotFoundError,
    AudioTooLargeError,
    ClaimNotFoundError,
    DuplicateClaimError,
    EmptyAudioError,
    InterviewNotFoundError,
    InvalidAudioError,
    UnsupportedAudioFormatError,
    UpstreamProviderError,
)


def _error_response(status_code: int, error_code: str, detail: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": error_code, "detail": detail},
    )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(InterviewNotFoundError)
    async def handle_interview_not_found(
        _request: Request,
        exc: InterviewNotFoundError,
    ) -> JSONResponse:
        return _error_response(status.HTTP_404_NOT_FOUND, "interview_not_found", str(exc))

    @app.exception_handler(AudioNotFoundError)
    async def handle_audio_not_found(
        _request: Request,
        exc: AudioNotFoundError,
    ) -> JSONResponse:
        return _error_response(status.HTTP_404_NOT_FOUND, "audio_not_found", str(exc))

    @app.exception_handler(ClaimNotFoundError)
    async def handle_claim_not_found(
        _request: Request,
        exc: ClaimNotFoundError,
    ) -> JSONResponse:
        return _error_response(status.HTTP_404_NOT_FOUND, "claim_not_found", str(exc))

    @app.exception_handler(DuplicateClaimError)
    async def handle_duplicate_claim(
        _request: Request,
        exc: DuplicateClaimError,
    ) -> JSONResponse:
        return _error_response(status.HTTP_409_CONFLICT, "duplicate_claim", str(exc))

    @app.exception_handler(EmptyAudioError)
    async def handle_empty_audio(
        _request: Request,
        exc: EmptyAudioError,
    ) -> JSONResponse:
        return _error_response(status.HTTP_400_BAD_REQUEST, "empty_audio", str(exc))

    @app.exception_handler(AudioTooLargeError)
    async def handle_audio_too_large(
        _request: Request,
        exc: AudioTooLargeError,
    ) -> JSONResponse:
        return _error_response(
            status.HTTP_413_CONTENT_TOO_LARGE,
            "audio_too_large",
            str(exc),
        )

    @app.exception_handler(UnsupportedAudioFormatError)
    async def handle_unsupported_audio_format(
        _request: Request,
        exc: UnsupportedAudioFormatError,
    ) -> JSONResponse:
        return _error_response(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            "unsupported_audio_format",
            str(exc),
        )

    @app.exception_handler(InvalidAudioError)
    async def handle_invalid_audio(
        _request: Request,
        exc: InvalidAudioError,
    ) -> JSONResponse:
        return _error_response(status.HTTP_400_BAD_REQUEST, "invalid_audio", str(exc))

    @app.exception_handler(UpstreamProviderError)
    async def handle_upstream_provider_error(
        _request: Request,
        exc: UpstreamProviderError,
    ) -> JSONResponse:
        return _error_response(
            status.HTTP_502_BAD_GATEWAY,
            "upstream_provider_error",
            f"Upstream provider '{exc.provider}' failed to process the request.",
        )
