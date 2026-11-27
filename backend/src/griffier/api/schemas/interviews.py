from typing import Self

from pydantic import BaseModel, Field, field_validator, model_validator

from griffier.domain.models import Claim


class RenameSpeakersRequest(BaseModel):
    speaker_map: dict[str, str] = Field(min_length=1)

    @field_validator("speaker_map")
    @classmethod
    def _validate_speaker_names(cls, value: dict[str, str]) -> dict[str, str]:
        cleaned: dict[str, str] = {}
        for old_name, new_name in value.items():
            old_clean = old_name.strip()
            new_clean = new_name.strip()
            if not old_clean or not new_clean:
                raise ValueError("Speaker names in speaker_map must be non-empty.")
            cleaned[old_clean] = new_clean
        return cleaned


class MarkedPassageRequest(BaseModel):
    segment_id: str = Field(min_length=1)
    quote: str = Field(min_length=1)
    start_offset: int | None = Field(default=None, ge=0)
    end_offset: int | None = Field(default=None, ge=0)

    @field_validator("segment_id", "quote")
    @classmethod
    def _validate_non_blank(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Value must not be blank.")
        return cleaned

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


class CheckMarkedPassagesRequest(BaseModel):
    passages: list[MarkedPassageRequest] = Field(min_length=1)


class CheckMarkedPassagesResponse(BaseModel):
    claims: list[Claim] = Field(default_factory=list[Claim])
    warnings: list[str] = Field(default_factory=list[str])
