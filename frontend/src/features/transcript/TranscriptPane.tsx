import { ArrowDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";

import {
  Button,
  ButtonShapes,
  ButtonSizes,
  ButtonVariants,
} from "../../components/ui";
import type { ContextMenuPosition } from "../../components/ui";
import type { Interview } from "../../types/interview";
import { AudioPlaybar } from "./AudioPlaybar";
import { formatTimestampMs } from "./formatTime";
import { useTranscriptPlayback } from "./useTranscriptPlayback";

export interface TranscriptPaneProps {
  readonly interview: Interview;
  readonly audioUrl: string | null;
  readonly audioLoading: boolean;
  readonly audioUnavailable: boolean;
  readonly onSpeakerContextMenu: (
    speaker: string,
    position: ContextMenuPosition,
  ) => void;
}

export function TranscriptPane({
  interview,
  audioUrl,
  audioLoading,
  audioUnavailable,
  onSpeakerContextMenu,
}: TranscriptPaneProps) {
  const [isAutoFollowPaused, setIsAutoFollowPaused] = useState(false);
  const segmentRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  const {
    audioRef,
    currentTimeMs,
    durationMs,
    isPlaying,
    activeSegmentId,
    hasAudioError,
    togglePlayback,
    seekTo,
    audioHandlers,
  } = useTranscriptPlayback(interview.segments);

  const isPlaybarUnavailable = audioUnavailable || hasAudioError;

  useEffect(() => {
    if (!isPlaying || isAutoFollowPaused || !activeSegmentId) {
      return;
    }
    const element = segmentRefs.current.get(activeSegmentId);
    element?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeSegmentId, isPlaying, isAutoFollowPaused]);

  const handleManualScrollIntent = () => {
    if (isPlaying && !isAutoFollowPaused) {
      setIsAutoFollowPaused(true);
    }
  };

  const handleResumeFollow = () => {
    setIsAutoFollowPaused(false);
    if (activeSegmentId) {
      segmentRefs.current
        .get(activeSegmentId)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const handleSpeakerRightClick = (
    event: MouseEvent<HTMLSpanElement>,
    speaker: string,
  ) => {
    event.preventDefault();
    onSpeakerContextMenu(speaker, { x: event.clientX, y: event.clientY });
  };

  return (
    <section
      aria-label="Transcript"
      className="relative flex min-h-0 flex-col rounded-2xl bg-surface-subtle p-4"
    >
      <audio
        ref={audioRef}
        src={audioUrl ?? undefined}
        preload="metadata"
        {...audioHandlers}
      />

      <header className="flex h-7 items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Transcript
        </h2>
        <time
          dateTime={interview.created_at}
          className="shrink-0 font-mono text-xs text-text-muted"
        >
          {new Date(interview.created_at).toLocaleDateString()}
        </time>
      </header>

      <div
        onWheel={handleManualScrollIntent}
        onTouchMove={handleManualScrollIntent}
        className="min-h-0 flex-1 overflow-y-auto py-4 pr-1"
      >
        {interview.segments.length === 0 ? (
          <p className="text-sm text-text-muted">
            No transcript segments were returned for this audio.
          </p>
        ) : (
          <ol className="flex flex-col gap-5">
            {interview.segments.map((segment) => {
              const isActive = segment.id === activeSegmentId;
              return (
                <li
                  key={segment.id}
                  ref={(node) => {
                    if (node) {
                      segmentRefs.current.set(segment.id, node);
                    } else {
                      segmentRefs.current.delete(segment.id);
                    }
                  }}
                  className="flex flex-col gap-1"
                >
                  <div className="flex items-center gap-2">
                    <span
                      onContextMenu={(event) =>
                        handleSpeakerRightClick(event, segment.speaker)
                      }
                      title="Right-click to rename speaker"
                      className="cursor-context-menu text-xs font-semibold text-text-primary"
                    >
                      {segment.speaker}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAutoFollowPaused(false);
                        seekTo(segment.start_ms);
                      }}
                      title={`Jump to ${formatTimestampMs(segment.start_ms)}`}
                      className="cursor-pointer rounded-xs px-1 py-0.5 font-mono text-xs text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
                    >
                      {formatTimestampMs(segment.start_ms)}
                    </button>
                  </div>
                  <p
                    className={[
                      "text-sm leading-relaxed transition-colors duration-200",
                      isActive
                        ? "text-transcript-active"
                        : "text-transcript-inactive",
                    ].join(" ")}
                  >
                    {segment.text}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {isPlaying && isAutoFollowPaused && (
        <div className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center">
          <Button
            variant={ButtonVariants.PRIMARY}
            size={ButtonSizes.SM}
            shape={ButtonShapes.PILL}
            onClick={handleResumeFollow}
            className="pointer-events-auto shadow-floating"
          >
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
            Follow playback
          </Button>
        </div>
      )}

      <div className="pt-3">
        <AudioPlaybar
          currentTimeMs={currentTimeMs}
          durationMs={durationMs}
          isPlaying={isPlaying}
          loading={audioLoading}
          unavailable={isPlaybarUnavailable}
          onTogglePlayback={() => {
            void togglePlayback();
          }}
          onSeek={seekTo}
        />
      </div>
    </section>
  );
}
