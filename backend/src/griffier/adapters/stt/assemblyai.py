import asyncio
from collections.abc import Sequence

import assemblyai as aai
import httpx

from griffier.domain.errors import UpstreamProviderError
from griffier.domain.models import AudioAsset, TranscriptSegment

PROVIDER_NAME = "AssemblyAI"
DEFAULT_BASE_URL = "https://api.assemblyai.com"
DEFAULT_SPEECH_MODEL = "assemblyai-stt-3-7"
DEFAULT_SPEAKER_TYPE = "role"
DEFAULT_KNOWN_SPEAKERS: tuple[str, ...] = ("Interviewer", "Interviewee")
DEFAULT_POLL_INTERVAL_SECONDS = 1.0
DEFAULT_POLL_TIMEOUT_SECONDS = 110.0
DEFAULT_REQUEST_TIMEOUT_SECONDS = 30.0


class AssemblyAITranscriber:
    def __init__(
        self,
        api_key: str,
        *,
        base_url: str = DEFAULT_BASE_URL,
        speech_model: str = DEFAULT_SPEECH_MODEL,
        speaker_type: str = DEFAULT_SPEAKER_TYPE,
        known_speakers: Sequence[str] = DEFAULT_KNOWN_SPEAKERS,
        poll_interval_seconds: float = DEFAULT_POLL_INTERVAL_SECONDS,
        poll_timeout_seconds: float = DEFAULT_POLL_TIMEOUT_SECONDS,
        request_timeout_seconds: float = DEFAULT_REQUEST_TIMEOUT_SECONDS,
        client: aai.Client | None = None,
    ) -> None:
        if poll_interval_seconds <= 0:
            raise ValueError("poll_interval_seconds must be positive.")
        if poll_timeout_seconds <= 0:
            raise ValueError("poll_timeout_seconds must be positive.")

        self._api_key = api_key.strip()
        self._base_url = base_url.rstrip("/")
        self._speech_model = speech_model
        self._speaker_type = speaker_type
        self._known_speakers = list(known_speakers)
        self._poll_interval_seconds = poll_interval_seconds
        self._poll_timeout_seconds = poll_timeout_seconds
        self._request_timeout_seconds = request_timeout_seconds
        self._client = client

    async def transcribe(self, audio: AudioAsset) -> list[TranscriptSegment]:
        if not self._api_key:
            raise UpstreamProviderError(PROVIDER_NAME, "ASSEMBLYAI_API_KEY is not configured.")

        return await asyncio.to_thread(self._transcribe_sync, audio)

    def _transcribe_sync(self, audio: AudioAsset) -> list[TranscriptSegment]:
        client = self._client or self._build_client()
        owns_client = self._client is None

        try:
            transcriber = aai.Transcriber(client=client, config=self._build_config())
            transcript = transcriber.transcribe(
                audio.data,
                poll_timeout=self._poll_timeout_seconds,
            )
        except TimeoutError as exc:
            raise UpstreamProviderError(
                PROVIDER_NAME,
                f"Transcription timed out after {self._poll_timeout_seconds:.0f}s.",
            ) from exc
        except httpx.TimeoutException as exc:
            raise UpstreamProviderError(PROVIDER_NAME, "Request timed out.") from exc
        except httpx.HTTPError as exc:
            raise UpstreamProviderError(PROVIDER_NAME, f"Network error: {exc}") from exc
        except aai.AssemblyAIError as exc:
            raise UpstreamProviderError(PROVIDER_NAME, str(exc)) from exc
        except ValueError as exc:
            raise UpstreamProviderError(PROVIDER_NAME, "Invalid response payload.") from exc
        finally:
            if owns_client:
                client.close()

        if transcript.status == aai.TranscriptStatus.error:
            detail = transcript.error or "Transcription failed without an error message."
            raise UpstreamProviderError(PROVIDER_NAME, detail)

        if transcript.status != aai.TranscriptStatus.completed:
            raise UpstreamProviderError(
                PROVIDER_NAME,
                f"Unexpected transcript status '{transcript.status}'.",
            )

        return self._normalize_segments(transcript)

    def _build_client(self) -> aai.Client:
        settings = aai.Settings(
            api_key=self._api_key,
            base_url=self._base_url,
            http_timeout=self._request_timeout_seconds,
            polling_interval=self._poll_interval_seconds,
        )
        return aai.Client(settings=settings)

    def _build_config(self) -> aai.TranscriptionConfig:
        return aai.TranscriptionConfig(
            speech_models=[self._speech_model],
            language_detection=True,
            speaker_labels=True,
            speech_understanding={
                "request": {
                    "speaker_identification": {
                        "speaker_type": self._speaker_type,
                        "known_values": self._known_speakers,
                    }
                }
            },
        )

    def _normalize_segments(self, transcript: aai.Transcript) -> list[TranscriptSegment]:
        if transcript.utterances:
            segments: list[TranscriptSegment] = []
            for utterance in transcript.utterances:
                text = utterance.text.strip()
                if not text:
                    continue
                start_ms = max(0, utterance.start)
                segments.append(
                    TranscriptSegment(
                        id=f"seg-{len(segments) + 1}",
                        speaker=self._normalize_speaker(utterance.speaker),
                        start_ms=start_ms,
                        end_ms=max(start_ms, utterance.end),
                        text=text,
                    )
                )
            if segments:
                return segments

        fallback_text = (transcript.text or "").strip()
        if not fallback_text:
            return []

        duration_ms = max(0, int((transcript.audio_duration or 0) * 1000))
        return [
            TranscriptSegment(
                id="seg-1",
                speaker="Speaker A",
                start_ms=0,
                end_ms=duration_ms,
                text=fallback_text,
            )
        ]

    @staticmethod
    def _normalize_speaker(speaker: str | None) -> str:
        cleaned = (speaker or "").strip()
        if not cleaned:
            return "Speaker A"
        if len(cleaned) == 1 and cleaned.isalpha() and cleaned.isupper():
            return f"Speaker {cleaned}"
        return cleaned
