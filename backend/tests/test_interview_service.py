from collections.abc import Sequence

import pytest

from griffier.adapters.storage.in_memory import InMemoryInterviewRepository
from griffier.adapters.storage.in_memory_audio import InMemoryAudioStore
from griffier.domain.errors import UpstreamProviderError
from griffier.domain.models import (
    AudioAsset,
    Claim,
    ClaimOrigin,
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
from griffier.services.interview_service import InterviewService, MarkedPassageInput


class _FakeTranscriber:
    def __init__(self, segments: list[TranscriptSegment] | None = None, fail: bool = False) -> None:
        self._segments = segments or [
            TranscriptSegment(
                id="seg-1",
                speaker="Interviewer",
                start_ms=0,
                end_ms=2500,
                text="How did inflation change last year?",
            ),
            TranscriptSegment(
                id="seg-2",
                speaker="Interviewee",
                start_ms=2600,
                end_ms=6000,
                text="Inflation fell by 2 percent last year.",
            ),
        ]
        self._fail = fail

    async def transcribe(self, audio: AudioAsset) -> list[TranscriptSegment]:
        if self._fail:
            raise UpstreamProviderError("AssemblyAI", "STT unavailable")
        return self._segments


class _FakeAnalyzer:
    def __init__(
        self,
        *,
        fail_extract: bool = False,
        fail_marked_queries: bool = False,
        fail_verify: bool = False,
    ) -> None:
        self._fail_extract = fail_extract
        self._fail_marked_queries = fail_marked_queries
        self._fail_verify = fail_verify

    async def extract_interview_analysis(
        self,
        segments: Sequence[TranscriptSegment],
    ) -> InterviewAnalysis:
        if self._fail_extract:
            raise UpstreamProviderError("LLM", "Extract failed")
        return InterviewAnalysis(
            summary="Interview discussing annual inflation figures.",
            topics=[TopicQuery(topic="Inflation", search_query="annual inflation report")],
            claims=[
                ExtractedClaim(
                    segment_id="seg-2",
                    quote="Inflation fell by 2 percent last year.",
                    speaker="Interviewee",
                    reason="Specific macroeconomic figure.",
                    search_query="inflation fell 2 percent official statistics",
                )
            ],
        )

    async def generate_marked_queries(
        self,
        passages: Sequence[MarkedPassage],
    ) -> list[MarkedPassageQuery]:
        if self._fail_marked_queries:
            raise UpstreamProviderError("LLM", "Query generation failed")
        return [
            MarkedPassageQuery(
                claim_id=item.claim_id,
                segment_id=item.segment_id,
                quote=item.quote,
                reason="Verify marked passage figure.",
                search_query=f"verify {item.quote}",
            )
            for item in passages
        ]

    async def verify_claims_against_sources(
        self,
        claims: Sequence[Claim],
        indexed_sources: Sequence[IndexedSource],
    ) -> list[ClaimVerification]:
        if self._fail_verify:
            raise UpstreamProviderError("LLM", "Verification failed")
        first_id = indexed_sources[0].source_id if indexed_sources else 1
        return [
            ClaimVerification(
                claim_id=claim.id,
                explanation=f"Confirmed by official data [{first_id}].",
                source_ids=[first_id],
                verdict=ClaimVerdict.SUPPORTED,
            )
            for claim in claims
        ]


class _FakeSearcher:
    def __init__(self, *, fail_queries: set[str] | None = None) -> None:
        self._fail_queries = fail_queries or set()

    async def search(self, query: str, max_results: int = 5) -> list[ExternalSource]:
        if query in self._fail_queries:
            raise UpstreamProviderError("Tavily", f"Failed for {query}")
        return [
            ExternalSource(
                title=f"Source for {query}",
                url=f"https://example.com/{abs(hash(query)) % 10000}",
                snippet="Official figures confirm a 2% decline.",
                published_date="2026-01-15",
            )
        ]


def _build_audio() -> AudioAsset:
    return AudioAsset(
        data=b"audio-bytes",
        content_type="audio/mpeg",
        filename="budget_interview.mp3",
    )


async def test_process_audio_runs_full_pipeline_and_attaches_real_urls() -> None:
    # Arrange
    repo = InMemoryInterviewRepository()
    audio_store = InMemoryAudioStore()
    service = InterviewService(
        transcriber=_FakeTranscriber(),
        analyzer=_FakeAnalyzer(),
        searcher=_FakeSearcher(),
        repository=repo,
        audio_store=audio_store,
    )

    # Act
    interview = await service.process_audio(_build_audio())
    stored_audio = await service.get_interview_audio(interview.id)

    # Assert
    assert interview.title == "Budget Interview"
    assert interview.summary == "Interview discussing annual inflation figures."
    assert len(interview.segments) == 2
    assert len(interview.sources) == 1
    assert len(interview.claims) == 1
    assert interview.claims[0].origin is ClaimOrigin.AI
    assert interview.claims[0].verdict is ClaimVerdict.SUPPORTED
    assert len(interview.claims[0].sources) == 1
    assert interview.claims[0].sources[0].url.startswith("https://example.com/")
    assert interview.warnings == []
    assert stored_audio == _build_audio()


async def test_process_audio_degrades_gracefully_on_partial_search_and_verification_failure() -> (
    None
):
    # Arrange
    service = InterviewService(
        transcriber=_FakeTranscriber(),
        analyzer=_FakeAnalyzer(fail_verify=True),
        searcher=_FakeSearcher(fail_queries={"annual inflation report"}),
        repository=InMemoryInterviewRepository(),
        audio_store=InMemoryAudioStore(),
    )

    # Act
    interview = await service.process_audio(_build_audio())

    # Assert
    assert len(interview.segments) == 2
    assert len(interview.claims) == 1
    assert interview.claims[0].verdict is ClaimVerdict.UNVERIFIED
    assert len(interview.warnings) == 2


async def test_process_audio_preserves_transcript_when_initial_analysis_fails() -> None:
    # Arrange
    service = InterviewService(
        transcriber=_FakeTranscriber(),
        analyzer=_FakeAnalyzer(fail_extract=True),
        searcher=_FakeSearcher(),
        repository=InMemoryInterviewRepository(),
        audio_store=InMemoryAudioStore(),
    )

    # Act
    interview = await service.process_audio(_build_audio(), title="Custom Title")

    # Assert
    assert interview.title == "Custom Title"
    assert len(interview.segments) == 2
    assert interview.claims == []
    assert len(interview.warnings) == 1


async def test_process_audio_propagates_transcription_failure() -> None:
    # Arrange
    service = InterviewService(
        transcriber=_FakeTranscriber(fail=True),
        analyzer=_FakeAnalyzer(),
        searcher=_FakeSearcher(),
        repository=InMemoryInterviewRepository(),
        audio_store=InMemoryAudioStore(),
    )

    # Act & Assert
    with pytest.raises(UpstreamProviderError, match="STT unavailable"):
        await service.process_audio(_build_audio())


async def test_check_marked_passages_persists_and_enriches_journalist_claims() -> None:
    # Arrange
    service = InterviewService(
        transcriber=_FakeTranscriber(),
        analyzer=_FakeAnalyzer(),
        searcher=_FakeSearcher(),
        repository=InMemoryInterviewRepository(),
        audio_store=InMemoryAudioStore(),
    )
    interview = await service.process_audio(_build_audio())

    # Act
    result = await service.check_marked_passages(
        interview.id,
        [
            MarkedPassageInput(
                segment_id="seg-2",
                quote="Inflation fell by 2 percent",
                start_offset=0,
                end_offset=27,
            )
        ],
    )
    refreshed = await service.get_interview(interview.id)

    # Assert
    assert result.warnings == []
    assert len(result.claims) == 1
    assert result.claims[0].origin is ClaimOrigin.JOURNALIST
    assert result.claims[0].speaker == "Interviewee"
    assert result.claims[0].verdict is ClaimVerdict.SUPPORTED
    assert len(result.claims[0].sources) == 1
    assert len(refreshed.claims) == 2


async def test_check_marked_passages_keeps_saved_claims_when_enrichment_fails() -> None:
    # Arrange
    service = InterviewService(
        transcriber=_FakeTranscriber(),
        analyzer=_FakeAnalyzer(fail_marked_queries=True),
        searcher=_FakeSearcher(),
        repository=InMemoryInterviewRepository(),
        audio_store=InMemoryAudioStore(),
    )
    interview = await service.process_audio(_build_audio())

    # Act
    result = await service.check_marked_passages(
        interview.id,
        [MarkedPassageInput(segment_id="seg-2", quote="Inflation fell by 2 percent")],
    )
    refreshed = await service.get_interview(interview.id)

    # Assert
    assert len(result.claims) == 1
    assert result.claims[0].verdict is ClaimVerdict.UNVERIFIED
    assert len(result.warnings) == 1
    assert len(refreshed.claims) == 2
