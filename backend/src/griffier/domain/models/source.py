from pydantic import BaseModel


class ExternalSource(BaseModel):
    title: str
    url: str
    snippet: str
    published_date: str | None = None


class IndexedSource(BaseModel):
    source_id: int
    source: ExternalSource
