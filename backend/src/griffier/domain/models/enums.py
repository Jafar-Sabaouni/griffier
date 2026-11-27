from enum import StrEnum


class ClaimOrigin(StrEnum):
    AI = "ai"
    JOURNALIST = "journalist"


class ClaimVerdict(StrEnum):
    SUPPORTED = "supported"
    CONTRADICTED = "contradicted"
    NEEDS_CONTEXT = "needs_context"
    UNVERIFIED = "unverified"
