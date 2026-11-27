from collections.abc import Sequence

from griffier.domain.errors import (
    ClaimNotFoundError,
    DuplicateClaimError,
    InterviewNotFoundError,
)
from griffier.domain.models import Claim, Interview


class InMemoryInterviewRepository:
    def __init__(self) -> None:
        self._interviews: dict[str, Interview] = {}

    async def save(self, interview: Interview) -> Interview:
        stored_interview = interview.model_copy(deep=True)
        self._interviews[interview.id] = stored_interview
        return stored_interview.model_copy(deep=True)

    async def get(self, interview_id: str) -> Interview:
        interview = self._require_interview(interview_id)
        return interview.model_copy(deep=True)

    async def list_all(self) -> list[Interview]:
        ordered = sorted(
            self._interviews.values(),
            key=lambda item: item.created_at,
            reverse=True,
        )
        return [item.model_copy(deep=True) for item in ordered]

    async def add_claims(self, interview_id: str, claims: Sequence[Claim]) -> list[Claim]:
        interview = self._require_interview(interview_id)
        seen_ids = {claim.id for claim in interview.claims}
        added: list[Claim] = []
        for claim in claims:
            if claim.id in seen_ids:
                raise DuplicateClaimError(interview_id, claim.id)
            seen_ids.add(claim.id)
            added.append(claim.model_copy(deep=True))

        updated = interview.model_copy(update={"claims": [*interview.claims, *added]})
        self._interviews[interview_id] = updated
        return [claim.model_copy(deep=True) for claim in added]

    async def update_claims(self, interview_id: str, claims: Sequence[Claim]) -> list[Claim]:
        interview = self._require_interview(interview_id)
        updates_by_id: dict[str, Claim] = {}
        for claim in claims:
            if claim.id in updates_by_id:
                raise DuplicateClaimError(interview_id, claim.id)
            updates_by_id[claim.id] = claim.model_copy(deep=True)

        existing_ids = {claim.id for claim in interview.claims}
        for claim_id in updates_by_id:
            if claim_id not in existing_ids:
                raise ClaimNotFoundError(interview_id, claim_id)

        merged_claims = [updates_by_id.get(claim.id, claim) for claim in interview.claims]
        self._interviews[interview_id] = interview.model_copy(update={"claims": merged_claims})
        return [updates_by_id[claim.id].model_copy(deep=True) for claim in claims]

    async def remove_claim(self, interview_id: str, claim_id: str) -> None:
        interview = self._require_interview(interview_id)
        remaining = [claim for claim in interview.claims if claim.id != claim_id]
        if len(remaining) == len(interview.claims):
            raise ClaimNotFoundError(interview_id, claim_id)
        self._interviews[interview_id] = interview.model_copy(update={"claims": remaining})

    async def rename_speakers(
        self,
        interview_id: str,
        speaker_map: dict[str, str],
    ) -> Interview:
        interview = self._require_interview(interview_id)
        renamed_segments = [
            segment.model_copy(
                update={"speaker": speaker_map.get(segment.speaker, segment.speaker)}
            )
            for segment in interview.segments
        ]
        renamed_claims = [
            claim.model_copy(update={"speaker": speaker_map.get(claim.speaker, claim.speaker)})
            for claim in interview.claims
        ]
        updated = interview.model_copy(
            update={"segments": renamed_segments, "claims": renamed_claims}
        )
        self._interviews[interview_id] = updated
        return updated.model_copy(deep=True)

    def _require_interview(self, interview_id: str) -> Interview:
        interview = self._interviews.get(interview_id)
        if interview is None:
            raise InterviewNotFoundError(interview_id)
        return interview
