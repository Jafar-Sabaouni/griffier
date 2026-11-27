import type { MouseEvent } from "react";

import type { Claim, TranscriptSegment } from "../../types/interview";
import { HighlightKinds, resolveSegmentHighlights } from "./highlights";
import type { HighlightKind, PendingMark } from "./highlights";

export interface HighlightedSegmentTextProps {
  readonly segment: TranscriptSegment;
  readonly claims: readonly Claim[];
  readonly pendingMarks: readonly PendingMark[];
  readonly isActive: boolean;
  readonly onContextMenu: (event: MouseEvent<HTMLParagraphElement>) => void;
  readonly onPendingMarkClick: (markId: string) => void;
  readonly onPendingMarkContextMenu: (
    event: MouseEvent<HTMLElement>,
    markId: string,
  ) => void;
}

const HIGHLIGHT_CLASSES: Readonly<Record<HighlightKind, string>> = {
  [HighlightKinds.AI]:
    "rounded-xs bg-mark-ai-bg text-inherit underline decoration-mark-ai-underline decoration-2 underline-offset-2",
  [HighlightKinds.JOURNALIST]:
    "rounded-xs bg-mark-journalist-bg text-inherit border-b-2 border-mark-journalist-border",
  [HighlightKinds.PENDING]:
    "cursor-pointer rounded-xs bg-mark-journalist-bg text-inherit border-b-2 border-dashed border-mark-journalist-border",
};

export function HighlightedSegmentText({
  segment,
  claims,
  pendingMarks,
  isActive,
  onContextMenu,
  onPendingMarkClick,
  onPendingMarkContextMenu,
}: HighlightedSegmentTextProps) {
  const { runs, hasSegmentFallbackAi } = resolveSegmentHighlights(
    segment,
    claims,
    pendingMarks,
  );

  return (
    <p
      data-segment-id={segment.id}
      onContextMenu={onContextMenu}
      className={[
        "text-sm leading-relaxed transition-colors duration-200",
        isActive ? "text-transcript-active" : "text-transcript-inactive",
        hasSegmentFallbackAi ? "border-l-2 border-mark-ai-underline pl-2.5" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {runs.map((run, index) => {
        if (!run.highlight) {
          return <span key={index}>{run.text}</span>;
        }

        const { id, kind } = run.highlight;
        const isPending = kind === HighlightKinds.PENDING;

        return (
          <mark
            key={`${id}-${index}`}
            data-highlight-kind={kind}
            title={
              isPending
                ? "Marked to fact-check — click or right-click to remove"
                : kind === HighlightKinds.JOURNALIST
                  ? "Fact-checked passage (journalist)"
                  : "Fact-checked claim (AI)"
            }
            onClick={
              isPending
                ? (event) => {
                    const selection = window.getSelection();
                    if (selection && !selection.isCollapsed) {
                      return;
                    }
                    event.stopPropagation();
                    onPendingMarkClick(id);
                  }
                : undefined
            }
            onContextMenu={
              isPending
                ? (event) => {
                    const selection = window.getSelection();
                    if (selection && !selection.isCollapsed) {
                      return;
                    }
                    event.preventDefault();
                    event.stopPropagation();
                    onPendingMarkContextMenu(event, id);
                  }
                : undefined
            }
            className={HIGHLIGHT_CLASSES[kind]}
          >
            {run.text}
          </mark>
        );
      })}
    </p>
  );
}
