from collections.abc import Sequence
from pathlib import Path

from griffier.domain.models import (
    Claim,
    ClaimVerdict,
    ClaimVerification,
    ExternalSource,
    IndexedSource,
    TranscriptSegment,
)


def canonical_url_key(url: str) -> str:
    return url.strip().rstrip("/")


def title_from_filename(filename: str) -> str:
    stem = Path(filename).stem.replace("-", " ").replace("_", " ").strip()
    return stem.title() if stem else "Untitled Interview"


def deduplicate_sources(sources: Sequence[ExternalSource]) -> list[ExternalSource]:
    unique: list[ExternalSource] = []
    seen: set[str] = set()
    for source in sources:
        key = canonical_url_key(source.url)
        if not key or key in seen:
            continue
        seen.add(key)
        unique.append(source)
    return unique


def index_sources(sources: Sequence[ExternalSource]) -> list[IndexedSource]:
    return [
        IndexedSource(source_id=index, source=source)
        for index, source in enumerate(sources, start=1)
    ]


def apply_verifications(
    claims: Sequence[Claim],
    verifications: Sequence[ClaimVerification],
    indexed_sources: Sequence[IndexedSource],
) -> list[Claim]:
    verifications_by_id = {item.claim_id: item for item in verifications}
    sources_by_id = {item.source_id: item.source for item in indexed_sources}
    enriched: list[Claim] = []

    for claim in claims:
        verification = verifications_by_id.get(claim.id)
        if verification is None:
            enriched.append(claim)
            continue

        attached_sources = (
            []
            if verification.verdict is ClaimVerdict.UNVERIFIED
            else [
                sources_by_id[source_id]
                for source_id in dict.fromkeys(verification.source_ids)
                if source_id in sources_by_id
            ]
        )
        enriched.append(
            claim.model_copy(
                update={
                    "verdict": verification.verdict,
                    "explanation": verification.explanation,
                    "sources": attached_sources,
                }
            )
        )

    return enriched


def build_segment_context(segments: Sequence[TranscriptSegment], segment_id: str) -> str:
    for index, segment in enumerate(segments):
        if segment.id != segment_id:
            continue
        window = segments[max(0, index - 1) : index + 2]
        return " ".join(f"{item.speaker}: {item.text}" for item in window)
    return ""
