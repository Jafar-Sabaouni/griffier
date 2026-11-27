from pydantic import AwareDatetime, BaseModel, Field

from griffier.domain.models.claim import Claim, ExtractedClaim
from griffier.domain.models.source import ExternalSource
from griffier.domain.models.transcript import TranscriptSegment


class Interview(BaseModel):
    id: str
    title: str
    created_at: AwareDatetime
    summary: str = ""
    segments: list[TranscriptSegment] = Field(default_factory=list[TranscriptSegment])
    claims: list[Claim] = Field(default_factory=list[Claim])
    sources: list[ExternalSource] = Field(default_factory=list[ExternalSource])
    warnings: list[str] = Field(default_factory=list[str])


class TopicQuery(BaseModel):
    topic: str = Field(description="Short 2-5 word topic label in the interview's language.")
    search_query: str = Field(
        description=(
            "Concise, self-contained web search query (3-8 keywords) with concrete entities, "
            "locations, or years."
        )
    )


class InterviewAnalysis(BaseModel):
    summary: str = Field(
        description="2-4 sentence neutral summary of the interview in its primary language."
    )
    topics: list[TopicQuery] = Field(
        default_factory=list[TopicQuery],
        description="2-5 distinct key topics discussed (empty if no substantive topics appear).",
    )
    claims: list[ExtractedClaim] = Field(
        default_factory=list[ExtractedClaim],
        description=(
            "Prioritized list of concrete, check-worthy factual claims (empty if none exist; "
            "exclude opinions, predictions, questions, and greetings)."
        ),
    )
