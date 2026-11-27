import pytest

from griffier.adapters.storage.in_memory_audio import InMemoryAudioStore
from griffier.domain.errors import AudioNotFoundError
from griffier.domain.models import AudioAsset
from griffier.domain.protocols import AudioStore


def _build_audio(size: int = 10, filename: str = "clip.mp3") -> AudioAsset:
    return AudioAsset(
        data=b"a" * size,
        content_type="audio/mpeg",
        filename=filename,
    )


async def test_audio_store_satisfies_protocol_and_round_trips_audio() -> None:
    # Arrange
    store: AudioStore = InMemoryAudioStore(max_bytes=100)
    audio = _build_audio(size=16)

    # Act
    await store.save("int-1", audio)
    fetched = await store.get("int-1")

    # Assert
    assert fetched == audio
    assert store.total_bytes == 16


async def test_audio_store_evicts_least_recently_used_entries_over_capacity() -> None:
    # Arrange
    store = InMemoryAudioStore(max_bytes=20)
    first = _build_audio(size=10, filename="first.mp3")
    second = _build_audio(size=10, filename="second.mp3")
    third = _build_audio(size=10, filename="third.mp3")

    # Act
    await store.save("int-1", first)
    await store.save("int-2", second)
    # Access int-1 so int-2 becomes the least recently used entry.
    await store.get("int-1")
    await store.save("int-3", third)

    # Assert
    assert await store.get("int-1") == first
    assert await store.get("int-3") == third
    assert store.total_bytes == 20
    with pytest.raises(AudioNotFoundError):
        await store.get("int-2")


async def test_audio_store_overwriting_existing_id_updates_byte_accounting() -> None:
    # Arrange
    store = InMemoryAudioStore(max_bytes=20)
    await store.save("int-1", _build_audio(size=12))
    replacement = _build_audio(size=8, filename="updated.mp3")

    # Act
    await store.save("int-1", replacement)

    # Assert
    assert await store.get("int-1") == replacement
    assert store.total_bytes == 8


async def test_audio_store_retains_latest_item_even_if_larger_than_max_bytes() -> None:
    # Arrange
    store = InMemoryAudioStore(max_bytes=10)
    await store.save("int-1", _build_audio(size=8))
    oversized = _build_audio(size=15, filename="large.mp3")

    # Act
    await store.save("int-2", oversized)

    # Assert
    assert await store.get("int-2") == oversized
    assert store.total_bytes == 15
    with pytest.raises(AudioNotFoundError):
        await store.get("int-1")


async def test_audio_store_delete_removes_entry_and_is_idempotent() -> None:
    # Arrange
    store = InMemoryAudioStore(max_bytes=50)
    await store.save("int-1", _build_audio(size=12))

    # Act
    await store.delete("int-1")
    await store.delete("int-1")

    # Assert
    assert store.total_bytes == 0
    with pytest.raises(AudioNotFoundError):
        await store.get("int-1")


def test_audio_store_rejects_non_positive_max_bytes() -> None:
    # Act & Assert
    with pytest.raises(ValueError):
        InMemoryAudioStore(max_bytes=0)
    with pytest.raises(ValueError):
        InMemoryAudioStore(max_bytes=-1)
