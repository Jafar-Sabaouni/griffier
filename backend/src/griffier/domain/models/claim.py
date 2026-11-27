from typing import Self

from pydantic import BaseModel, Field, model_validator

from griffier.domain.models.enums import ClaimOrigin, ClaimVerdict
from griffier.domain.models.source import ExternalSource


class Claim(BaseModel):
    id: str
    origin: ClaimOrigin
    verdict: ClaimVerdict = ClaimVerdict.UNVERIFIED
    segment_id: str
    speaker: str
    quote: str
    start_offset: int | None = Field(default=None, ge=0)
    end_offset: int | None = Field(default=None, ge=0)
    explanation: str = ""
    sources: list[ExternalSource] = Field(default_factory=list[ExternalSource])

    @model_validator(mode="after")
    def _validate_offsets(self) -> Self:
        if (self.start_offset is None) != (self.end_offset is None):
            raise ValueError("start_offset and end_offset must either both be set or both be None.")
        if (
            self.start_offset is not None
            and self.end_offset is not None
            and self.end_offset < self.start_offset
        ):
            raise ValueError("end_offset must be greater than or equal to start_offset.")
        return self


class ExtractedClaim(BaseModel):
    segment_id: str
    quote: str
    speaker: str
    reason: str
    search_query: str


class MarkedPassage(BaseModel):
    claim_id: str
    segment_id: str
    quote: str
    speaker: str
    context: str = ""


class MarkedPassageQuery(BaseModel):
    claim_id: str
    segment_id: str
    quote: str
    reason: str
    search_query: str


class ClaimVerification(BaseModel):
    claim_id: str
    verdict: ClaimVerdict
    explanation: str
    source_ids: list[int] = Field(default_factory=list[int])
