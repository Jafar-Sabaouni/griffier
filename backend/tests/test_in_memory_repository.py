from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from griffier.adapters.storage.in_memory import InMemoryInterviewRepository
from griffier.domain.errors import (
    ClaimNotFoundError,
    DuplicateClaimError,
    InterviewNotFoundError,
)
from griffier.domain.models import (
    AudioAsset,
    Claim,
    ClaimOrigin,
    ClaimVerdict,
    ExternalSource,
    Interview,
    TranscriptSegment,
)
from griffier.domain.protocols import InterviewRepository


def _build_claim(
    claim_id: str = "claim-1",
    speaker: str = "Speaker A",
    origin: ClaimOrigin = ClaimOrigin.AI,
    verdict: ClaimVerdict = ClaimVerdict.UNVERIFIED,
) -> Claim:
    return Claim(
        id=claim_id,
        origin=origin,
        verdict=verdict,
        segment_id="seg-1",
        speaker=speaker,
        quote="Inflation fell by 2% last year.",
        explanation="Initial check pending.",
    )


def _build_interview(
    interview_id: str = "int-1",
    created_at: datetime | None = None,
    claims: list[Claim] | None = None,
) -> Interview:
    return Interview(
        id=interview_id,
        title="City Council Interview",
        created_at=created_at or datetime(2026, 11, 26, 12, 0, tzinfo=UTC),
        summary="Discussion on municipal budget.",
        segments=[
            TranscriptSegment(
                id="seg-1",
                speaker="Speaker A",
                start_ms=0,
                end_ms=4200,
                text="Inflation fell by 2% last year.",
            ),
            TranscriptSegment(
                id="seg-2",
                speaker="Speaker B",
                start_ms=4300,
                end_ms=8000,
                text="Can you share the official figures?",
            ),
        ],
        claims=claims if claims is not None else [_build_claim()],
        sources=[
            ExternalSource(
                title="CBS Statistics",
                url="https://example.com/cbs",
                snippet="Annual inflation report.",
                published_date="2026-01-15",
            )
        ],
        warnings=[],
    )


async def test_repository_satisfies_protocol_and_saves_interview() -> None:
    repo: InterviewRepository = InMemoryInterviewRepository()
    interview = _build_interview()

    saved = await repo.save(interview)
    fetched = await repo.get(interview.id)

    assert saved == interview
    assert fetched == interview


async def test_list_all_returns_interviews_newest_first() -> None:
    repo = InMemoryInterviewRepository()
    older = _build_interview(
        interview_id="int-old",
        created_at=datetime(2026, 11, 25, 10, 0, tzinfo=UTC),
    )
    newer = _build_interview(
        interview_id="int-new",
        created_at=datetime(2026, 11, 26, 10, 0, tzinfo=UTC),
    )
    await repo.save(older)
    await repo.save(newer)

    interviews = await repo.list_all()

    assert [item.id for item in interviews] == [newer.id, older.id]


async def test_add_claims_appends_to_interview() -> None:
    repo = InMemoryInterviewRepository()
    interview = _build_interview(claims=[])
    await repo.save(interview)
    new_claim = _build_claim(
        claim_id="claim-j1",
        origin=ClaimOrigin.JOURNALIST,
    ).model_copy(update={"start_offset": 0, "end_offset": 14})

    added = await repo.add_claims(interview.id, [new_claim])
    stored = await repo.get(interview.id)

    assert added == [new_claim]
    assert stored.claims == [new_claim]


async def test_add_claims_rejects_duplicate_claim_ids() -> None:
    repo = InMemoryInterviewRepository()
    existing = _build_claim(claim_id="claim-1")
    interview = _build_interview(claims=[existing])
    await repo.save(interview)

    with pytest.raises(DuplicateClaimError):
        await repo.add_claims(interview.id, [_build_claim(claim_id="claim-1")])

    with pytest.raises(DuplicateClaimError):
        await repo.add_claims(
            interview.id,
            [_build_claim(claim_id="claim-2"), _build_claim(claim_id="claim-2")],
        )


async def test_update_claims_replaces_existing_claims_in_place() -> None:
    repo = InMemoryInterviewRepository()
    original = _build_claim(claim_id="claim-1", verdict=ClaimVerdict.UNVERIFIED)
    interview = _build_interview(claims=[original])
    await repo.save(interview)
    verified_source = ExternalSource(
        title="Official Report",
        url="https://example.com/report",
        snippet="Confirmed figure.",
    )
    updated_claim = original.model_copy(
        update={
            "verdict": ClaimVerdict.SUPPORTED,
            "explanation": "Confirmed by [1].",
            "sources": [verified_source],
        }
    )

    result = await repo.update_claims(interview.id, [updated_claim])
    stored = await repo.get(interview.id)

    assert result == [updated_claim]
    assert stored.claims == [updated_claim]


async def test_update_claims_rejects_duplicate_claim_ids_in_batch() -> None:
    repo = InMemoryInterviewRepository()
    claim = _build_claim(claim_id="claim-1")
    interview = _build_interview(claims=[claim])
    await repo.save(interview)

    with pytest.raises(DuplicateClaimError):
        await repo.update_claims(interview.id, [claim, claim])


async def test_remove_claim_deletes_matching_claim() -> None:
    repo = InMemoryInterviewRepository()
    claim_one = _build_claim(claim_id="claim-1")
    claim_two = _build_claim(claim_id="claim-2", speaker="Speaker B")
    interview = _build_interview(claims=[claim_one, claim_two])
    await repo.save(interview)

    await repo.remove_claim(interview.id, claim_one.id)
    stored = await repo.get(interview.id)

    assert stored.claims == [claim_two]


async def test_rename_speakers_updates_segments_and_claims_atomically() -> None:
    repo = InMemoryInterviewRepository()
    claim_a = _build_claim(claim_id="claim-1", speaker="Speaker A")
    claim_b = _build_claim(claim_id="claim-2", speaker="Speaker B")
    interview = _build_interview(claims=[claim_a, claim_b])
    await repo.save(interview)
    speaker_map = {"Speaker A": "Jan Peeters", "Speaker B": "Mieke De Vries"}

    updated = await repo.rename_speakers(interview.id, speaker_map)
    stored = await repo.get(interview.id)

    expected_speakers = [speaker_map["Speaker A"], speaker_map["Speaker B"]]
    assert [segment.speaker for segment in updated.segments] == expected_speakers
    assert [claim.speaker for claim in updated.claims] == expected_speakers
    assert stored == updated


async def test_missing_interview_raises_interview_not_found_error() -> None:
    repo = InMemoryInterviewRepository()
    missing_id = "missing-id"

    with pytest.raises(InterviewNotFoundError):
        await repo.get(missing_id)
    with pytest.raises(InterviewNotFoundError):
        await repo.add_claims(missing_id, [_build_claim()])
    with pytest.raises(InterviewNotFoundError):
        await repo.update_claims(missing_id, [_build_claim()])
    with pytest.raises(InterviewNotFoundError):
        await repo.remove_claim(missing_id, "claim-1")
    with pytest.raises(InterviewNotFoundError):
        await repo.rename_speakers(missing_id, {"Speaker A": "Jan"})


async def test_missing_claim_raises_claim_not_found_error() -> None:
    repo = InMemoryInterviewRepository()
    interview = _build_interview(claims=[_build_claim(claim_id="claim-1")])
    await repo.save(interview)
    unknown_claim = _build_claim(claim_id="claim-missing")

    with pytest.raises(ClaimNotFoundError):
        await repo.update_claims(interview.id, [unknown_claim])
    with pytest.raises(ClaimNotFoundError):
        await repo.remove_claim(interview.id, unknown_claim.id)


def test_domain_model_invariants() -> None:
    audio = AudioAsset(data=b"secret-binary", content_type="audio/mpeg", filename="clip.mp3")
    assert "secret-binary" not in repr(audio)

    with pytest.raises(ValidationError):
        Interview(
            id="int-naive",
            title="Naive timestamp",
            created_at=datetime(2026, 11, 26, 12, 0),
        )

    with pytest.raises(ValidationError):
        TranscriptSegment(id="seg-1", speaker="A", start_ms=500, end_ms=100, text="Invalid range")

    with pytest.raises(ValidationError):
        Claim(
            id="c-1",
            origin=ClaimOrigin.JOURNALIST,
            segment_id="seg-1",
            speaker="A",
            quote="Quote",
            start_offset=10,
            end_offset=None,
        )

    with pytest.raises(ValidationError):
        Claim(
            id="c-2",
            origin=ClaimOrigin.JOURNALIST,
            segment_id="seg-1",
            speaker="A",
            quote="Quote",
            start_offset=20,
            end_offset=10,
        )
