from typing import Self

from pydantic import BaseModel, Field, model_validator


class TranscriptSegment(BaseModel):
    id: str
    speaker: str
    start_ms: int = Field(ge=0)
    end_ms: int = Field(ge=0)
    text: str

    @model_validator(mode="after")
    def _validate_time_range(self) -> Self:
        if self.end_ms < self.start_ms:
            raise ValueError("end_ms must be greater than or equal to start_ms.")
        return self
