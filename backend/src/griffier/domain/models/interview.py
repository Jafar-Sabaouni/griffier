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
    topic: str
    search_query: str


class InterviewAnalysis(BaseModel):
    summary: str
    topics: list[TopicQuery] = Field(default_factory=list[TopicQuery])
    claims: list[ExtractedClaim] = Field(default_factory=list[ExtractedClaim])
