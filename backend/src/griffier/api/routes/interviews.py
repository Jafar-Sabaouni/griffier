from typing import Annotated

from fastapi import APIRouter, File, Form, Response, UploadFile, status

from griffier.api.schemas.interviews import (
    CheckMarkedPassagesRequest,
    CheckMarkedPassagesResponse,
    RenameSpeakersRequest,
)
from griffier.dependencies import InterviewServiceDep
from griffier.domain.errors import (
    AudioTooLargeError,
    EmptyAudioError,
    UnsupportedAudioFormatError,
)
from griffier.domain.models import AudioAsset, Interview
from griffier.services.interview_service import MarkedPassageInput

MAX_AUDIO_BYTES = 25 * 1024 * 1024

ALLOWED_AUDIO_MIME_TYPES: frozenset[str] = frozenset(
    {
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/x-wav",
        "audio/wave",
        "audio/webm",
        "audio/mp4",
        "audio/m4a",
        "audio/x-m4a",
        "audio/ogg",
    }
)

router = APIRouter(prefix="/api/interviews", tags=["interviews"])


def _normalize_mime_type(content_type: str | None) -> str:
    if not content_type:
        return ""
    return content_type.split(";", maxsplit=1)[0].strip().lower()


async def _validate_and_read_audio(file: UploadFile) -> AudioAsset:
    mime_type = _normalize_mime_type(file.content_type)
    if mime_type not in ALLOWED_AUDIO_MIME_TYPES:
        raise UnsupportedAudioFormatError(file.content_type or "unknown")

    data = await file.read(MAX_AUDIO_BYTES + 1)
    if len(data) == 0:
        raise EmptyAudioError()
    if len(data) > MAX_AUDIO_BYTES:
        raise AudioTooLargeError(size_bytes=len(data), max_bytes=MAX_AUDIO_BYTES)

    return AudioAsset(
        data=data,
        content_type=mime_type,
        filename=file.filename or "recording",
    )


@router.get("")
async def list_interviews(service: InterviewServiceDep) -> list[Interview]:
    return await service.list_interviews()


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_interview(
    service: InterviewServiceDep,
    file: Annotated[UploadFile, File()],
    title: Annotated[str | None, Form()] = None,
) -> Interview:
    audio = await _validate_and_read_audio(file)
    return await service.process_audio(audio, title=title)


@router.get("/{interview_id}")
async def get_interview(
    interview_id: str,
    service: InterviewServiceDep,
) -> Interview:
    return await service.get_interview(interview_id)


@router.get("/{interview_id}/audio")
async def get_interview_audio(
    interview_id: str,
    service: InterviewServiceDep,
) -> Response:
    audio = await service.get_interview_audio(interview_id)
    return Response(content=audio.data, media_type=audio.content_type)


@router.patch("/{interview_id}/speakers")
async def rename_speakers(
    interview_id: str,
    payload: RenameSpeakersRequest,
    service: InterviewServiceDep,
) -> Interview:
    return await service.rename_speakers(interview_id, payload.speaker_map)


@router.post("/{interview_id}/claims/check", status_code=status.HTTP_201_CREATED)
async def check_marked_passages(
    interview_id: str,
    payload: CheckMarkedPassagesRequest,
    service: InterviewServiceDep,
) -> CheckMarkedPassagesResponse:
    passages = [
        MarkedPassageInput(
            segment_id=item.segment_id,
            quote=item.quote,
            start_offset=item.start_offset,
            end_offset=item.end_offset,
        )
        for item in payload.passages
    ]
    result = await service.check_marked_passages(interview_id, passages)
    return CheckMarkedPassagesResponse(claims=result.claims, warnings=result.warnings)


@router.delete("/{interview_id}/claims/{claim_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_claim(
    interview_id: str,
    claim_id: str,
    service: InterviewServiceDep,
) -> Response:
    await service.remove_claim(interview_id, claim_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
