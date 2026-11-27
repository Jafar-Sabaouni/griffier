from collections.abc import Sequence
from typing import Protocol

from griffier.domain.models import (
    AudioAsset,
    Claim,
    ClaimVerification,
    ExternalSource,
    IndexedSource,
    Interview,
    InterviewAnalysis,
    MarkedPassage,
    MarkedPassageQuery,
    TranscriptSegment,
)


class Transcriber(Protocol):
    async def transcribe(self, audio: AudioAsset) -> list[TranscriptSegment]: ...


class IntelligenceAnalyzer(Protocol):
    async def extract_interview_analysis(
        self,
        segments: Sequence[TranscriptSegment],
    ) -> InterviewAnalysis: ...

    async def generate_marked_queries(
        self,
        passages: Sequence[MarkedPassage],
    ) -> list[MarkedPassageQuery]: ...

    async def verify_claims_against_sources(
        self,
        claims: Sequence[Claim],
        indexed_sources: Sequence[IndexedSource],
    ) -> list[ClaimVerification]: ...


class SourceSearcher(Protocol):
    async def search(self, query: str, max_results: int = 5) -> list[ExternalSource]: ...


class InterviewRepository(Protocol):
    async def save(self, interview: Interview) -> Interview: ...

    async def get(self, interview_id: str) -> Interview: ...

    async def list_all(self) -> list[Interview]: ...

    async def add_claims(self, interview_id: str, claims: Sequence[Claim]) -> list[Claim]: ...

    async def update_claims(self, interview_id: str, claims: Sequence[Claim]) -> list[Claim]: ...

    async def remove_claim(self, interview_id: str, claim_id: str) -> None: ...

    async def rename_speakers(
        self,
        interview_id: str,
        speaker_map: dict[str, str],
    ) -> Interview: ...


class AudioStore(Protocol):
    async def save(self, interview_id: str, audio: AudioAsset) -> None: ...

    async def get(self, interview_id: str) -> AudioAsset: ...

    async def delete(self, interview_id: str) -> None: ...
