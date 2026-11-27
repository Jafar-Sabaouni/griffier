from pydantic import BaseModel, ConfigDict, Field


class AudioAsset(BaseModel):
    model_config = ConfigDict(frozen=True)

    data: bytes = Field(repr=False)
    content_type: str
    filename: str
