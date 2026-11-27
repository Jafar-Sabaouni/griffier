from collections import OrderedDict

from griffier.domain.errors import AudioNotFoundError
from griffier.domain.models import AudioAsset

DEFAULT_MAX_AUDIO_BYTES = 300 * 1024 * 1024


class InMemoryAudioStore:
    def __init__(self, max_bytes: int = DEFAULT_MAX_AUDIO_BYTES) -> None:
        if max_bytes <= 0:
            raise ValueError("max_bytes must be a positive integer.")
        self._max_bytes = max_bytes
        self._store: OrderedDict[str, AudioAsset] = OrderedDict()
        self._total_bytes = 0

    @property
    def total_bytes(self) -> int:
        return self._total_bytes

    async def save(self, interview_id: str, audio: AudioAsset) -> None:
        existing = self._store.pop(interview_id, None)
        if existing is not None:
            self._total_bytes -= len(existing.data)

        self._store[interview_id] = audio
        self._total_bytes += len(audio.data)

        while self._total_bytes > self._max_bytes and len(self._store) > 1:
            _, evicted = self._store.popitem(last=False)
            self._total_bytes -= len(evicted.data)

    async def get(self, interview_id: str) -> AudioAsset:
        audio = self._store.get(interview_id)
        if audio is None:
            raise AudioNotFoundError(interview_id)
        self._store.move_to_end(interview_id)
        return audio

    async def delete(self, interview_id: str) -> None:
        removed = self._store.pop(interview_id, None)
        if removed is not None:
            self._total_bytes -= len(removed.data)
