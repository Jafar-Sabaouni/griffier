import { useRef, useState } from "react";
import type { RefObject, SyntheticEvent } from "react";

import type { TranscriptSegment } from "../../types/interview";

function findActiveSegmentId(
  segments: readonly TranscriptSegment[],
  currentTimeMs: number,
): string | null {
  for (const segment of segments) {
    if (currentTimeMs >= segment.start_ms && currentTimeMs <= segment.end_ms) {
      return segment.id;
    }
  }
  return null;
}

function deriveFallbackDurationMs(
  segments: readonly TranscriptSegment[],
): number {
  const last = segments[segments.length - 1];
  return last ? last.end_ms : 0;
}

export interface AudioElementHandlers {
  readonly onTimeUpdate: (event: SyntheticEvent<HTMLAudioElement>) => void;
  readonly onLoadedMetadata: (event: SyntheticEvent<HTMLAudioElement>) => void;
  readonly onDurationChange: (event: SyntheticEvent<HTMLAudioElement>) => void;
  readonly onPlay: () => void;
  readonly onPause: () => void;
  readonly onEnded: () => void;
  readonly onError: () => void;
}

export interface UseTranscriptPlaybackResult {
  readonly audioRef: RefObject<HTMLAudioElement | null>;
  readonly currentTimeMs: number;
  readonly durationMs: number;
  readonly isPlaying: boolean;
  readonly activeSegmentId: string | null;
  readonly hasAudioError: boolean;
  readonly togglePlayback: () => Promise<void>;
  readonly seekTo: (timeMs: number) => void;
  readonly audioHandlers: AudioElementHandlers;
}

export function useTranscriptPlayback(
  segments: readonly TranscriptSegment[],
): UseTranscriptPlaybackResult {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [mediaDurationMs, setMediaDurationMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAudioError, setHasAudioError] = useState(false);

  const durationMs =
    mediaDurationMs > 0 ? mediaDurationMs : deriveFallbackDurationMs(segments);
  const activeSegmentId = findActiveSegmentId(segments, currentTimeMs);

  const syncDurationFromElement = (audio: HTMLAudioElement) => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      setMediaDurationMs(Math.round(audio.duration * 1000));
    }
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || hasAudioError) {
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
      return;
    }
    audio.pause();
  };

  const seekTo = (timeMs: number) => {
    const clampedMs = Math.max(
      0,
      durationMs > 0 ? Math.min(timeMs, durationMs) : timeMs,
    );
    setCurrentTimeMs(clampedMs);

    const audio = audioRef.current;
    if (audio && !hasAudioError) {
      audio.currentTime = clampedMs / 1000;
    }
  };

  const audioHandlers: AudioElementHandlers = {
    onTimeUpdate: (event) => {
      setCurrentTimeMs(Math.round(event.currentTarget.currentTime * 1000));
    },
    onLoadedMetadata: (event) => {
      setHasAudioError(false);
      syncDurationFromElement(event.currentTarget);
    },
    onDurationChange: (event) => {
      syncDurationFromElement(event.currentTarget);
    },
    onPlay: () => {
      setIsPlaying(true);
    },
    onPause: () => {
      setIsPlaying(false);
    },
    onEnded: () => {
      setIsPlaying(false);
    },
    onError: () => {
      setIsPlaying(false);
      setHasAudioError(true);
    },
  };

  return {
    audioRef,
    currentTimeMs,
    durationMs,
    isPlaying,
    activeSegmentId,
    hasAudioError,
    togglePlayback,
    seekTo,
    audioHandlers,
  };
}
