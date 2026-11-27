from collections.abc import Sequence

from fastapi.testclient import TestClient

from griffier.api.routes.interviews import MAX_AUDIO_BYTES
from griffier.config import Settings
from griffier.dependencies import (
    get_intelligence_analyzer,
    get_source_searcher,
    get_transcriber,
)
from griffier.domain.errors import UpstreamProviderError
from griffier.domain.models import (
    AudioAsset,
    Claim,
    ClaimVerdict,
    ClaimVerification,
    ExternalSource,
    ExtractedClaim,
    IndexedSource,
    InterviewAnalysis,
    MarkedPassage,
    MarkedPassageQuery,
    TopicQuery,
    TranscriptSegment,
)
from griffier.main import create_app


class _FakeTranscriber:
    def __init__(self, *, fail: bool = False) -> None:
        self._fail = fail

    async def transcribe(self, audio: AudioAsset) -> list[TranscriptSegment]:
        if self._fail:
            raise UpstreamProviderError("AssemblyAI", "raw-secret-vendor-payload")
        return [
            TranscriptSegment(
                id="seg-1",
                speaker="Speaker A",
                start_ms=0,
                end_ms=3000,
                text="Inflation fell by 2% last year.",
            ),
            TranscriptSegment(
                id="seg-2",
                speaker="Speaker B",
                start_ms=3100,
                end_ms=6000,
                text="Can you share the source?",
            ),
        ]


class _FakeAnalyzer:
    async def extract_interview_analysis(
        self,
        segments: Sequence[TranscriptSegment],
    ) -> InterviewAnalysis:
        return InterviewAnalysis(
            summary="Short inflation interview.",
            topics=[TopicQuery(topic="Inflation", search_query="inflation report")],
            claims=[
                ExtractedClaim(
                    segment_id="seg-1",
                    quote="Inflation fell by 2% last year.",
                    speaker="Speaker A",
                    reason="Check official statistics.",
                    search_query="inflation 2 percent official stats",
                )
            ],
        )

    async def generate_marked_queries(
        self,
        passages: Sequence[MarkedPassage],
    ) -> list[MarkedPassageQuery]:
        return [
            MarkedPassageQuery(
                claim_id=item.claim_id,
                segment_id=item.segment_id,
                quote=item.quote,
                reason="Verify marked passage.",
                search_query=f"check {item.quote}",
            )
            for item in passages
        ]

    async def verify_claims_against_sources(
        self,
        claims: Sequence[Claim],
        indexed_sources: Sequence[IndexedSource],
    ) -> list[ClaimVerification]:
        first_id = indexed_sources[0].source_id if indexed_sources else 1
        return [
            ClaimVerification(
                claim_id=claim.id,
                explanation=f"Confirmed by [{first_id}].",
                source_ids=[first_id],
                verdict=ClaimVerdict.SUPPORTED,
            )
            for claim in claims
        ]


class _FakeSearcher:
    async def search(self, query: str, max_results: int = 5) -> list[ExternalSource]:
        return [
            ExternalSource(
                title="CBS Statistics",
                url="https://www.cbs.nl/inflation",
                snippet="Annual inflation declined by 2%.",
                published_date="2026-01-15",
            )
        ]


def _build_client(*, fail_stt: bool = False) -> TestClient:
    app = create_app(Settings())
    app.dependency_overrides[get_transcriber] = lambda: _FakeTranscriber(fail=fail_stt)
    app.dependency_overrides[get_intelligence_analyzer] = lambda: _FakeAnalyzer()
    app.dependency_overrides[get_source_searcher] = lambda: _FakeSearcher()
    return TestClient(app)


def test_full_interview_lifecycle_endpoints() -> None:
    # Arrange
    client = _build_client()
    audio_bytes = b"fake-webm-audio"

    # Act: upload audio (including codec suffix in MIME type)
    create_response = client.post(
        "/api/interviews",
        files={"file": ("council.webm", audio_bytes, "audio/webm;codecs=opus")},
        data={"title": "Council Briefing"},
    )

    # Assert
    assert create_response.status_code == 201
    created = create_response.json()
    interview_id = created["id"]
    assert created["title"] == "Council Briefing"
    assert len(created["segments"]) == 2
    assert len(created["claims"]) == 1
    assert created["claims"][0]["verdict"] == "supported"
    assert created["claims"][0]["sources"][0]["url"] == "https://www.cbs.nl/inflation"

    # Act & Assert: list, get, and audio playback
    list_response = client.get("/api/interviews")
    assert list_response.status_code == 200
    assert [item["id"] for item in list_response.json()] == [interview_id]

    get_response = client.get(f"/api/interviews/{interview_id}")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == interview_id

    audio_response = client.get(f"/api/interviews/{interview_id}/audio")
    assert audio_response.status_code == 200
    assert audio_response.content == audio_bytes
    assert audio_response.headers["content-type"].startswith("audio/webm")

    # Act & Assert: rename speakers
    rename_response = client.patch(
        f"/api/interviews/{interview_id}/speakers",
        json={"speaker_map": {"Speaker A": "Jan Peeters"}},
    )
    assert rename_response.status_code == 200
    renamed = rename_response.json()
    assert renamed["segments"][0]["speaker"] == "Jan Peeters"
    assert renamed["claims"][0]["speaker"] == "Jan Peeters"

    # Act & Assert: batch check journalist-marked passages
    check_response = client.post(
        f"/api/interviews/{interview_id}/claims/check",
        json={
            "passages": [
                {
                    "segment_id": "seg-1",
                    "quote": "Inflation fell by 2%",
                    "start_offset": 0,
                    "end_offset": 20,
                }
            ]
        },
    )
    assert check_response.status_code == 201
    checked = check_response.json()
    assert checked["warnings"] == []
    assert len(checked["claims"]) == 1
    marked_claim_id = checked["claims"][0]["id"]
    assert checked["claims"][0]["origin"] == "journalist"
    assert checked["claims"][0]["speaker"] == "Jan Peeters"
    assert checked["claims"][0]["verdict"] == "supported"

    # Act & Assert: delete claim
    delete_response = client.delete(f"/api/interviews/{interview_id}/claims/{marked_claim_id}")
    assert delete_response.status_code == 204
    refreshed = client.get(f"/api/interviews/{interview_id}").json()
    assert len(refreshed["claims"]) == 1


def test_upload_guards_reject_empty_oversized_and_unsupported_files() -> None:
    # Arrange
    client = _build_client()

    # Act
    empty_resp = client.post(
        "/api/interviews",
        files={"file": ("empty.mp3", b"", "audio/mpeg")},
    )
    oversized_resp = client.post(
        "/api/interviews",
        files={"file": ("huge.mp3", b"x" * (MAX_AUDIO_BYTES + 1), "audio/mpeg")},
    )
    bad_mime_resp = client.post(
        "/api/interviews",
        files={"file": ("notes.pdf", b"%PDF-1.4", "application/pdf")},
    )

    # Assert
    assert empty_resp.status_code == 400
    assert empty_resp.json()["error"] == "empty_audio"
    assert oversized_resp.status_code == 413
    assert oversized_resp.json()["error"] == "audio_too_large"
    assert bad_mime_resp.status_code == 415
    assert bad_mime_resp.json()["error"] == "unsupported_audio_format"


def test_error_handlers_return_structured_404_422_and_502() -> None:
    # Arrange
    client = _build_client()
    failing_stt_client = _build_client(fail_stt=True)

    # Act
    missing_interview = client.get("/api/interviews/does-not-exist")
    missing_audio = client.get("/api/interviews/does-not-exist/audio")
    bad_rename = client.patch(
        "/api/interviews/does-not-exist/speakers",
        json={"speaker_map": {"Speaker A": "   "}},
    )
    bad_check = client.post(
        "/api/interviews/does-not-exist/claims/check",
        json={"passages": []},
    )
    stt_failure = failing_stt_client.post(
        "/api/interviews",
        files={"file": ("clip.mp3", b"audio", "audio/mpeg")},
    )

    # Assert
    assert missing_interview.status_code == 404
    assert missing_interview.json()["error"] == "interview_not_found"
    assert missing_audio.status_code == 404
    assert missing_audio.json()["error"] == "audio_not_found"
    assert bad_rename.status_code == 422
    assert bad_check.status_code == 422
    assert stt_failure.status_code == 502
    assert stt_failure.json()["error"] == "upstream_provider_error"
    assert "raw-secret-vendor-payload" not in stt_failure.text
