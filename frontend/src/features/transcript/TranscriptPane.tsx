import { ArrowDown, BookmarkPlus, CheckCheck } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MouseEvent, RefObject } from "react";

import {
  Button,
  ButtonShapes,
  ButtonSizes,
  ButtonVariants,
  ContextMenu,
} from "../../components/ui";
import type { ContextMenuItem, ContextMenuPosition } from "../../components/ui";
import type { Interview } from "../../types/interview";
import { AudioPlaybar } from "./AudioPlaybar";
import { HighlightedSegmentText } from "./HighlightedSegmentText";
import { formatTimestampMs } from "./formatTime";
import {
  readSelectionInContainer,
  readSelectionInElement,
} from "./highlights";
import type { PendingMark, SegmentSelection } from "./highlights";
import { useTranscriptPlayback } from "./useTranscriptPlayback";

function areSelectionsEqual(
  a: SegmentSelection | null,
  b: SegmentSelection | null,
): boolean {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return (
    a.segmentId === b.segmentId &&
    a.startOffset === b.startOffset &&
    a.endOffset === b.endOffset &&
    a.quote === b.quote
  );
}

function useContainerSelection(
  containerRef: RefObject<HTMLElement | null>,
): SegmentSelection | null {
  const cacheRef = useRef<SegmentSelection | null>(null);

  const subscribe = (listener: () => void) => {
    document.addEventListener("selectionchange", listener);
    return () => {
      document.removeEventListener("selectionchange", listener);
    };
  };

  const getSnapshot = (): SegmentSelection | null => {
    const next = readSelectionInContainer(containerRef.current);
    if (!areSelectionsEqual(cacheRef.current, next)) {
      cacheRef.current = next;
    }
    return cacheRef.current;
  };

  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

const PassageMenuKinds = {
  MARK: "mark",
  UNMARK: "unmark",
} as const;

type PassageMenuState =
  | {
      readonly kind: typeof PassageMenuKinds.MARK;
      readonly selection: SegmentSelection;
      readonly position: ContextMenuPosition;
    }
  | {
      readonly kind: typeof PassageMenuKinds.UNMARK;
      readonly markId: string;
      readonly position: ContextMenuPosition;
    };

export interface TranscriptFocusRequest {
  readonly segmentId: string;
  readonly seq: number;
}

export interface TranscriptPaneProps {
  readonly interview: Interview;
  readonly audioUrl: string | null;
  readonly audioLoading: boolean;
  readonly audioUnavailable: boolean;
  readonly pendingMarks: readonly PendingMark[];
  readonly isCheckingMarks: boolean;
  readonly checkMarksError: string | null;
  readonly focusedClaimId: string | null;
  readonly focusRequest: TranscriptFocusRequest | null;
  readonly onSpeakerContextMenu: (
    speaker: string,
    position: ContextMenuPosition,
  ) => void;
  readonly onClaimHighlightClick: (claimId: string, segmentId: string) => void;
  readonly onAddPendingMark: (selection: SegmentSelection) => void;
  readonly onRemovePendingMark: (markId: string) => void;
  readonly onCheckPendingMarks: () => void;
}

export function TranscriptPane({
  interview,
  audioUrl,
  audioLoading,
  audioUnavailable,
  pendingMarks,
  isCheckingMarks,
  checkMarksError,
  focusedClaimId,
  focusRequest,
  onSpeakerContextMenu,
  onClaimHighlightClick,
  onAddPendingMark,
  onRemovePendingMark,
  onCheckPendingMarks,
}: TranscriptPaneProps) {
  const [isAutoFollowPaused, setIsAutoFollowPaused] = useState(false);
  const [passageMenu, setPassageMenu] = useState<PassageMenuState | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const activeSelection = useContainerSelection(transcriptContainerRef);

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
  const seekToRef = useRef(seekTo);
  const segmentsRef = useRef(interview.segments);
  useEffect(() => {
    seekToRef.current = seekTo;
    segmentsRef.current = interview.segments;
  }, [seekTo, interview.segments]);

  const focusSegmentId = focusRequest?.segmentId ?? null;
  const focusSeq = focusRequest?.seq ?? 0;

  useEffect(() => {
    if (!focusSegmentId || focusSeq === 0) {
      return;
    }
    const element = segmentRefs.current.get(focusSegmentId);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
    const targetSegment = segmentsRef.current.find(
      (segment) => segment.id === focusSegmentId,
    );
    if (targetSegment) {
      seekToRef.current(targetSegment.start_ms);
    }
  }, [focusSegmentId, focusSeq]);

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
    setPassageMenu(null);
    onSpeakerContextMenu(speaker, { x: event.clientX, y: event.clientY });
  };

  const commitMark = (selection: SegmentSelection) => {
    onAddPendingMark(selection);
    window.getSelection()?.removeAllRanges();
  };

  const handleSegmentContextMenu = (
    event: MouseEvent<HTMLParagraphElement>,
    segmentId: string,
  ) => {
    const selection = readSelectionInElement(event.currentTarget, segmentId);
    if (!selection) {
      return;
    }
    event.preventDefault();
    setPassageMenu({
      kind: PassageMenuKinds.MARK,
      selection,
      position: { x: event.clientX, y: event.clientY },
    });
  };

  const handlePendingMarkContextMenu = (
    event: MouseEvent<HTMLElement>,
    markId: string,
  ) => {
    setPassageMenu({
      kind: PassageMenuKinds.UNMARK,
      markId,
      position: { x: event.clientX, y: event.clientY },
    });
  };

  const passageMenuItems: readonly ContextMenuItem[] = passageMenu
    ? passageMenu.kind === PassageMenuKinds.MARK
      ? [
          {
            id: "mark-passage",
            label: "Mark to fact-check",
            disabled: isCheckingMarks,
            onSelect: () => commitMark(passageMenu.selection),
          },
        ]
      : [
          {
            id: "unmark-passage",
            label: "Remove mark",
            disabled: isCheckingMarks,
            onSelect: () => onRemovePendingMark(passageMenu.markId),
          },
        ]
    : [];

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
        ref={transcriptContainerRef}
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
                  <HighlightedSegmentText
                    segment={segment}
                    claims={interview.claims}
                    pendingMarks={pendingMarks}
                    isActive={isActive}
                    focusedClaimId={focusedClaimId}
                    onContextMenu={(event) =>
                      handleSegmentContextMenu(event, segment.id)
                    }
                    onClaimHighlightClick={(claimId) =>
                      onClaimHighlightClick(claimId, segment.id)
                    }
                    onPendingMarkClick={(markId) => {
                      if (!isCheckingMarks) {
                        onRemovePendingMark(markId);
                      }
                    }}
                    onPendingMarkContextMenu={handlePendingMarkContextMenu}
                  />
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

      {(activeSelection || pendingMarks.length > 0 || checkMarksError) && (
        <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
          {checkMarksError && (
            <p
              role="alert"
              className="rounded-md bg-status-danger-bg px-3 py-2 text-xs text-status-danger"
            >
              {checkMarksError}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {activeSelection && (
                <Button
                  variant={ButtonVariants.SECONDARY}
                  size={ButtonSizes.SM}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => commitMark(activeSelection)}
                  disabled={isCheckingMarks}
                >
                  <BookmarkPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  Mark to fact-check
                </Button>
              )}
              {pendingMarks.length > 0 && !activeSelection && (
                <span className="text-xs text-text-muted">
                  Click any marked passage to remove it
                </span>
              )}
            </div>

            {pendingMarks.length > 0 && (
              <Button
                variant={ButtonVariants.PRIMARY}
                size={ButtonSizes.SM}
                onClick={onCheckPendingMarks}
                disabled={isCheckingMarks}
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {isCheckingMarks
                  ? "Checking passages..."
                  : `Check marked passages (${pendingMarks.length})`}
              </Button>
            )}
          </div>
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

      <ContextMenu
        open={passageMenu !== null}
        position={passageMenu?.position ?? { x: 0, y: 0 }}
        ariaLabel="Passage actions"
        onClose={() => setPassageMenu(null)}
        items={passageMenuItems}
      />
    </section>
  );
}
