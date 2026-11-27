import json
from collections.abc import Callable

import assemblyai as aai
import httpx
import pytest

from griffier.adapters.stt.assemblyai import AssemblyAITranscriber
from griffier.domain.errors import UpstreamProviderError
from griffier.domain.models import AudioAsset, TranscriptSegment
from griffier.domain.protocols import Transcriber


def _build_audio() -> AudioAsset:
    return AudioAsset(
        data=b"fake-mp3-audio-bytes",
        content_type="audio/mpeg",
        filename="interview.mp3",
    )


class _MockAssemblyAIClient(aai.Client):
    def __init__(
        self,
        settings: aai.Settings,
        handler: Callable[[httpx.Request], httpx.Response],
    ) -> None:
        super().__init__(settings=settings)
        self._mock_http_client = httpx.Client(
            base_url=settings.base_url,
            headers={"authorization": settings.api_key or ""},
            transport=httpx.MockTransport(handler),
        )

    @property
    def http_client(self) -> httpx.Client:
        return self._mock_http_client

    def close(self) -> None:
        self._mock_http_client.close()
        super().close()


def _build_sdk_client(
    handler: Callable[[httpx.Request], httpx.Response],
    *,
    api_key: str = "test-aai-key",
    polling_interval: float = 0.001,
) -> aai.Client:
    settings = aai.Settings(
        api_key=api_key,
        base_url="https://api.assemblyai.com",
        polling_interval=polling_interval,
    )
    return _MockAssemblyAIClient(settings=settings, handler=handler)


async def test_transcriber_satisfies_protocol_and_normalizes_multi_speaker_utterances() -> None:
    # Arrange
    poll_count = 0
    captured_submit_body: dict[str, object] = {}
    captured_upload_bytes = b""

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal poll_count, captured_submit_body, captured_upload_bytes
        assert request.headers["authorization"] == "test-aai-key"

        if request.method == "POST" and request.url.path == "/v2/upload":
            captured_upload_bytes = request.content
            return httpx.Response(200, json={"upload_url": "https://cdn.assemblyai.com/audio-1"})

        if request.method == "POST" and request.url.path == "/v2/transcript":
            captured_submit_body = json.loads(request.content.decode("utf-8"))
            return httpx.Response(
                200,
                json={
                    "id": "tx-123",
                    "status": "queued",
                    "audio_url": "https://cdn.assemblyai.com/audio-1",
                },
            )

        if request.method == "GET" and request.url.path == "/v2/transcript/tx-123":
            poll_count += 1
            if poll_count == 1:
                return httpx.Response(
                    200,
                    json={
                        "id": "tx-123",
                        "status": "processing",
                        "audio_url": "https://cdn.assemblyai.com/audio-1",
                    },
                )
            return httpx.Response(
                200,
                json={
                    "id": "tx-123",
                    "status": "completed",
                    "audio_url": "https://cdn.assemblyai.com/audio-1",
                    "text": (
                        "Welcome to the program. "
                        "Inflation dropped by 2% last year. "
                        "Can you cite the source?"
                    ),
                    "utterances": [
                        {
                            "speaker": "Interviewer",
                            "start": 0,
                            "end": 3100,
                            "text": "Welcome to the program.",
                            "confidence": 0.99,
                            "words": [],
                        },
                        {
                            "speaker": "Interviewee",
                            "start": 3200,
                            "end": 7400,
                            "text": "Inflation dropped by 2% last year.",
                            "confidence": 0.97,
                            "words": [],
                        },
                        {
                            "speaker": "A",
                            "start": 7500,
                            "end": 9000,
                            "text": "  Can you cite the source?  ",
                            "confidence": 0.95,
                            "words": [],
                        },
                    ],
                },
            )

        raise AssertionError(f"Unexpected request: {request.method} {request.url}")

    sdk_client = _build_sdk_client(handler)
    try:
        transcriber: Transcriber = AssemblyAITranscriber(
            api_key="test-aai-key",
            poll_interval_seconds=0.001,
            poll_timeout_seconds=5.0,
            client=sdk_client,
        )

        # Act
        segments = await transcriber.transcribe(_build_audio())
    finally:
        sdk_client.close()

    # Assert
    assert captured_upload_bytes == b"fake-mp3-audio-bytes"
    assert captured_submit_body["audio_url"] == "https://cdn.assemblyai.com/audio-1"
    assert captured_submit_body["speech_models"] == ["assemblyai-stt-3-7"]
    assert captured_submit_body["language_detection"] is True
    assert captured_submit_body["speaker_labels"] is True
    assert captured_submit_body["speech_understanding"] == {
        "request": {
            "speaker_identification": {
                "speaker_type": "role",
                "known_values": ["Interviewer", "Interviewee"],
            }
        }
    }
    assert poll_count == 2
    assert segments == [
        TranscriptSegment(
            id="seg-1",
            speaker="Interviewer",
            start_ms=0,
            end_ms=3100,
            text="Welcome to the program.",
        ),
        TranscriptSegment(
            id="seg-2",
            speaker="Interviewee",
            start_ms=3200,
            end_ms=7400,
            text="Inflation dropped by 2% last year.",
        ),
        TranscriptSegment(
            id="seg-3",
            speaker="Speaker A",
            start_ms=7500,
            end_ms=9000,
            text="Can you cite the source?",
        ),
    ]


async def test_transcriber_falls_back_to_plain_text_when_utterances_missing() -> None:
    # Arrange
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/v2/upload":
            return httpx.Response(200, json={"upload_url": "https://cdn.assemblyai.com/audio-2"})
        if request.url.path == "/v2/transcript":
            return httpx.Response(
                200,
                json={
                    "id": "tx-plain",
                    "status": "queued",
                    "audio_url": "https://cdn.assemblyai.com/audio-2",
                },
            )
        return httpx.Response(
            200,
            json={
                "id": "tx-plain",
                "status": "completed",
                "audio_url": "https://cdn.assemblyai.com/audio-2",
                "text": "Single speaker statement.",
                "audio_duration": 5,
                "utterances": None,
            },
        )

    sdk_client = _build_sdk_client(handler)
    try:
        transcriber = AssemblyAITranscriber(
            api_key="test-aai-key",
            poll_interval_seconds=0.001,
            client=sdk_client,
        )

        # Act
        segments = await transcriber.transcribe(_build_audio())
    finally:
        sdk_client.close()

    # Assert
    assert segments == [
        TranscriptSegment(
            id="seg-1",
            speaker="Speaker A",
            start_ms=0,
            end_ms=5000,
            text="Single speaker statement.",
        )
    ]


async def test_transcriber_raises_upstream_error_on_assemblyai_error_status() -> None:
    # Arrange
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/v2/upload":
            return httpx.Response(200, json={"upload_url": "https://cdn.assemblyai.com/audio-3"})
        if request.url.path == "/v2/transcript":
            return httpx.Response(
                200,
                json={
                    "id": "tx-err",
                    "status": "queued",
                    "audio_url": "https://cdn.assemblyai.com/audio-3",
                },
            )
        return httpx.Response(
            200,
            json={
                "id": "tx-err",
                "status": "error",
                "audio_url": "https://cdn.assemblyai.com/audio-3",
                "error": "Audio file could not be decoded.",
            },
        )

    sdk_client = _build_sdk_client(handler)
    try:
        transcriber = AssemblyAITranscriber(
            api_key="test-aai-key",
            poll_interval_seconds=0.001,
            client=sdk_client,
        )

        # Act & Assert
        with pytest.raises(UpstreamProviderError, match="Audio file could not be decoded") as exc:
            await transcriber.transcribe(_build_audio())
        assert exc.value.provider == "AssemblyAI"
    finally:
        sdk_client.close()


async def test_transcriber_raises_upstream_error_on_http_failure() -> None:
    # Arrange
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, json={"error": "Service unavailable"})

    sdk_client = _build_sdk_client(handler)
    try:
        transcriber = AssemblyAITranscriber(api_key="test-aai-key", client=sdk_client)

        # Act & Assert
        with pytest.raises(UpstreamProviderError):
            await transcriber.transcribe(_build_audio())
    finally:
        sdk_client.close()


async def test_transcriber_raises_upstream_error_on_request_timeout() -> None:
    # Arrange
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("Timed out reading response")

    sdk_client = _build_sdk_client(handler)
    try:
        transcriber = AssemblyAITranscriber(api_key="test-aai-key", client=sdk_client)

        # Act & Assert
        with pytest.raises(UpstreamProviderError, match="timed out"):
            await transcriber.transcribe(_build_audio())
    finally:
        sdk_client.close()


async def test_transcriber_raises_upstream_error_on_poll_timeout() -> None:
    # Arrange
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/v2/upload":
            return httpx.Response(200, json={"upload_url": "https://cdn.assemblyai.com/audio-4"})
        if request.url.path == "/v2/transcript":
            return httpx.Response(
                200,
                json={
                    "id": "tx-slow",
                    "status": "queued",
                    "audio_url": "https://cdn.assemblyai.com/audio-4",
                },
            )
        return httpx.Response(
            200,
            json={
                "id": "tx-slow",
                "status": "processing",
                "audio_url": "https://cdn.assemblyai.com/audio-4",
            },
        )

    sdk_client = _build_sdk_client(handler, polling_interval=0.005)
    try:
        transcriber = AssemblyAITranscriber(
            api_key="test-aai-key",
            poll_interval_seconds=0.005,
            poll_timeout_seconds=0.02,
            client=sdk_client,
        )

        # Act & Assert
        with pytest.raises(UpstreamProviderError, match="did not finish within"):
            await transcriber.transcribe(_build_audio())
    finally:
        sdk_client.close()


async def test_transcriber_raises_upstream_error_when_api_key_missing() -> None:
    # Arrange
    transcriber = AssemblyAITranscriber(api_key="   ")

    # Act & Assert
    with pytest.raises(UpstreamProviderError, match="ASSEMBLYAI_API_KEY"):
        await transcriber.transcribe(_build_audio())


async def test_transcriber_raises_upstream_error_on_invalid_json_payload() -> None:
    # Arrange
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text="not-valid-json")

    sdk_client = _build_sdk_client(handler)
    try:
        transcriber = AssemblyAITranscriber(api_key="test-aai-key", client=sdk_client)

        # Act & Assert
        with pytest.raises(UpstreamProviderError, match="Invalid response payload"):
            await transcriber.transcribe(_build_audio())
    finally:
        sdk_client.close()
