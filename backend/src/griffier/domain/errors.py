class GriffierError(Exception):
    """Base exception for Griffier domain and adapter errors."""


class InterviewNotFoundError(GriffierError):
    def __init__(self, interview_id: str) -> None:
        self.interview_id = interview_id
        super().__init__(f"Interview '{interview_id}' not found.")


class AudioNotFoundError(GriffierError):
    def __init__(self, interview_id: str) -> None:
        self.interview_id = interview_id
        super().__init__(f"Audio for interview '{interview_id}' not found.")


class ClaimNotFoundError(GriffierError):
    def __init__(self, interview_id: str, claim_id: str) -> None:
        self.interview_id = interview_id
        self.claim_id = claim_id
        super().__init__(f"Claim '{claim_id}' not found in interview '{interview_id}'.")


class DuplicateClaimError(GriffierError):
    def __init__(self, interview_id: str, claim_id: str) -> None:
        self.interview_id = interview_id
        self.claim_id = claim_id
        super().__init__(f"Claim '{claim_id}' already exists in interview '{interview_id}'.")


class InvalidAudioError(GriffierError):
    """Base error for invalid audio uploads."""


class EmptyAudioError(InvalidAudioError):
    def __init__(self) -> None:
        super().__init__("Audio file is empty.")


class AudioTooLargeError(InvalidAudioError):
    def __init__(self, size_bytes: int, max_bytes: int) -> None:
        self.size_bytes = size_bytes
        self.max_bytes = max_bytes
        super().__init__(f"Audio file size ({size_bytes} bytes) exceeds limit ({max_bytes} bytes).")


class UnsupportedAudioFormatError(InvalidAudioError):
    def __init__(self, content_type: str) -> None:
        self.content_type = content_type
        super().__init__(f"Unsupported audio format: '{content_type}'.")


class UpstreamProviderError(GriffierError):
    def __init__(self, provider: str, detail: str) -> None:
        self.provider = provider
        self.detail = detail
        super().__init__(f"{provider} failed: {detail}")
