import asyncio
from collections.abc import Sequence
from datetime import UTC, datetime
from uuid import uuid4

from pydantic import BaseModel, Field

from griffier.domain.errors import UpstreamProviderError
from griffier.domain.models import (
    AudioAsset,
    Claim,
    ClaimOrigin,
    ClaimVerdict,
    ExternalSource,
    ExtractedClaim,
    Interview,
    MarkedPassage,
    MarkedPassageQuery,
    TopicQuery,
)
from griffier.domain.protocols import (
    AudioStore,
    IntelligenceAnalyzer,
    InterviewRepository,
    SourceSearcher,
    Transcriber,
)
from griffier.services.source_grounding import (
    apply_verifications,
    build_segment_context,
    deduplicate_sources,
    index_sources,
    title_from_filename,
)


class MarkedPassageInput(BaseModel):
    segment_id: str
    quote: str
    start_offset: int | None = None
    end_offset: int | None = None


class ClaimCheckResult(BaseModel):
    claims: list[Claim] = Field(default_factory=list[Claim])
    warnings: list[str] = Field(default_factory=list[str])


class InterviewService:
    def __init__(
        self,
        *,
        transcriber: Transcriber,
        analyzer: IntelligenceAnalyzer,
        searcher: SourceSearcher,
        repository: InterviewRepository,
        audio_store: AudioStore,
    ) -> None:
        self._transcriber = transcriber
        self._analyzer = analyzer
        self._searcher = searcher
        self._repository = repository
        self._audio_store = audio_store

    async def process_audio(
        self,
        audio: AudioAsset,
        *,
        title: str | None = None,
    ) -> Interview:
        segments = await self._transcriber.transcribe(audio)

        warnings: list[str] = []
        summary = ""
        topic_queries: list[TopicQuery] = []
        extracted_claims: list[ExtractedClaim] = []

        try:
            analysis = await self._analyzer.extract_interview_analysis(segments)
            summary = analysis.summary
            topic_queries = analysis.topics
            extracted_claims = analysis.claims
        except UpstreamProviderError:
            warnings.append("Initial AI analysis failed; transcript saved without AI claims.")

        claims = [
            Claim(
                id=f"claim-{uuid4().hex[:12]}",
                origin=ClaimOrigin.AI,
                verdict=ClaimVerdict.UNVERIFIED,
                segment_id=item.segment_id,
                speaker=item.speaker,
                quote=item.quote,
                explanation=item.reason,
            )
            for item in extracted_claims
        ]

        topic_sources, claim_sources, search_warnings = await self._search_for_analysis(
            topic_queries=topic_queries,
            extracted_claims=extracted_claims,
        )
        warnings.extend(search_warnings)

        all_sources = deduplicate_sources([*topic_sources, *claim_sources])
        verified_claims, verify_warnings = await self._verify_claims_fail_safe(
            claims=claims,
            sources=all_sources,
        )
        warnings.extend(verify_warnings)

        interview_title = (title or "").strip() or title_from_filename(audio.filename)
        interview = Interview(
            id=f"int-{uuid4().hex[:12]}",
            title=interview_title,
            created_at=datetime.now(UTC),
            summary=summary,
            segments=segments,
            claims=verified_claims,
            sources=topic_sources,
            warnings=warnings,
        )

        saved = await self._repository.save(interview)
        await self._audio_store.save(saved.id, audio)
        return saved

    async def check_marked_passages(
        self,
        interview_id: str,
        passages: Sequence[MarkedPassageInput],
    ) -> ClaimCheckResult:
        interview = await self._repository.get(interview_id)
        if not passages:
            return ClaimCheckResult()

        segments_by_id = {segment.id: segment for segment in interview.segments}
        new_claims = [
            Claim(
                id=f"claim-{uuid4().hex[:12]}",
                origin=ClaimOrigin.JOURNALIST,
                verdict=ClaimVerdict.UNVERIFIED,
                segment_id=item.segment_id,
                speaker=(
                    segments_by_id[item.segment_id].speaker
                    if item.segment_id in segments_by_id
                    else "Unknown Speaker"
                ),
                quote=item.quote,
                start_offset=item.start_offset,
                end_offset=item.end_offset,
            )
            for item in passages
        ]

        saved_claims = await self._repository.add_claims(interview_id, new_claims)
        warnings: list[str] = []

        marked_passages = [
            MarkedPassage(
                claim_id=claim.id,
                segment_id=claim.segment_id,
                quote=claim.quote,
                speaker=claim.speaker,
                context=build_segment_context(interview.segments, claim.segment_id),
            )
            for claim in saved_claims
        ]

        try:
            generated_queries = await self._analyzer.generate_marked_queries(marked_passages)
        except UpstreamProviderError:
            warnings.append("Query generation failed; marked passages saved as unverified.")
            return ClaimCheckResult(claims=saved_claims, warnings=warnings)

        queries_by_claim_id: dict[str, MarkedPassageQuery] = {
            item.claim_id: item for item in generated_queries
        }
        claims_with_reasons = [
            claim.model_copy(update={"explanation": queries_by_claim_id[claim.id].reason})
            if claim.id in queries_by_claim_id and queries_by_claim_id[claim.id].reason.strip()
            else claim
            for claim in saved_claims
        ]

        search_queries = [
            item.search_query.strip() for item in generated_queries if item.search_query.strip()
        ]
        retrieved_sources, search_warnings = await self._run_concurrent_searches(search_queries)
        warnings.extend(search_warnings)

        enriched_claims, verify_warnings = await self._verify_claims_fail_safe(
            claims=claims_with_reasons,
            sources=retrieved_sources,
        )
        warnings.extend(verify_warnings)

        updated_claims = await self._repository.update_claims(interview_id, enriched_claims)
        return ClaimCheckResult(claims=updated_claims, warnings=warnings)

    async def get_interview(self, interview_id: str) -> Interview:
        return await self._repository.get(interview_id)

    async def get_interview_audio(self, interview_id: str) -> AudioAsset:
        return await self._audio_store.get(interview_id)

    async def list_interviews(self) -> list[Interview]:
        return await self._repository.list_all()

    async def rename_speakers(
        self,
        interview_id: str,
        speaker_map: dict[str, str],
    ) -> Interview:
        return await self._repository.rename_speakers(interview_id, speaker_map)

    async def remove_claim(self, interview_id: str, claim_id: str) -> None:
        await self._repository.remove_claim(interview_id, claim_id)

    async def _search_for_analysis(
        self,
        *,
        topic_queries: Sequence[TopicQuery],
        extracted_claims: Sequence[ExtractedClaim],
    ) -> tuple[list[ExternalSource], list[ExternalSource], list[str]]:
        topic_search_strings = [
            item.search_query.strip() for item in topic_queries if item.search_query.strip()
        ]
        claim_search_strings = [
            item.search_query.strip() for item in extracted_claims if item.search_query.strip()
        ]
        all_queries = [*topic_search_strings, *claim_search_strings]
        if not all_queries:
            return [], [], []

        results = await asyncio.gather(
            *(self._searcher.search(query) for query in all_queries),
            return_exceptions=True,
        )

        topic_raw: list[ExternalSource] = []
        claim_raw: list[ExternalSource] = []
        failed_count = 0
        topic_count = len(topic_search_strings)

        for index, result in enumerate(results):
            if isinstance(result, BaseException):
                failed_count += 1
                continue
            if index < topic_count:
                topic_raw.extend(result)
            else:
                claim_raw.extend(result)

        warnings = (
            [f"External source search failed for {failed_count} query(s)."]
            if failed_count > 0
            else []
        )
        return deduplicate_sources(topic_raw), deduplicate_sources(claim_raw), warnings

    async def _run_concurrent_searches(
        self,
        queries: Sequence[str],
    ) -> tuple[list[ExternalSource], list[str]]:
        if not queries:
            return [], []

        results = await asyncio.gather(
            *(self._searcher.search(query) for query in queries),
            return_exceptions=True,
        )
        collected: list[ExternalSource] = []
        failed_count = 0
        for result in results:
            if isinstance(result, BaseException):
                failed_count += 1
                continue
            collected.extend(result)

        warnings = (
            [f"External source search failed for {failed_count} query(s)."]
            if failed_count > 0
            else []
        )
        return deduplicate_sources(collected), warnings

    async def _verify_claims_fail_safe(
        self,
        *,
        claims: Sequence[Claim],
        sources: Sequence[ExternalSource],
    ) -> tuple[list[Claim], list[str]]:
        if not claims or not sources:
            return list(claims), []

        indexed_sources = index_sources(sources)
        try:
            verifications = await self._analyzer.verify_claims_against_sources(
                claims,
                indexed_sources,
            )
        except UpstreamProviderError:
            return (
                list(claims),
                ["Claim verification failed; claims kept as unverified."],
            )

        return apply_verifications(claims, verifications, indexed_sources), []
