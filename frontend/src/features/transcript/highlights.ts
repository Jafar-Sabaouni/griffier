import { ClaimOrigins } from "../../types/interview";
import type { Claim, TranscriptSegment } from "../../types/interview";

export const HighlightKinds = {
  AI: "ai",
  JOURNALIST: "journalist",
  PENDING: "pending",
} as const;

export type HighlightKind =
  (typeof HighlightKinds)[keyof typeof HighlightKinds];

export const isHighlightKind = (value: string): value is HighlightKind =>
  Object.values(HighlightKinds).includes(value as HighlightKind);

export interface PendingMark {
  readonly id: string;
  readonly interviewId: string;
  readonly segmentId: string;
  readonly quote: string;
  readonly startOffset: number;
  readonly endOffset: number;
}

export interface SegmentSelection {
  readonly segmentId: string;
  readonly quote: string;
  readonly startOffset: number;
  readonly endOffset: number;
}

export interface TextHighlight {
  readonly id: string;
  readonly kind: HighlightKind;
  readonly start: number;
  readonly end: number;
}

export interface TextRun {
  readonly text: string;
  readonly highlight: TextHighlight | null;
}

export interface ResolvedSegmentHighlights {
  readonly runs: readonly TextRun[];
  readonly hasSegmentFallbackAi: boolean;
}

const HIGHLIGHT_PRIORITY: Readonly<Record<HighlightKind, number>> = {
  [HighlightKinds.AI]: 1,
  [HighlightKinds.JOURNALIST]: 2,
  [HighlightKinds.PENDING]: 3,
};

function getValidRange(
  start: number | null,
  end: number | null,
  textLength: number,
): { readonly start: number; readonly end: number } | null {
  if (
    start === null ||
    end === null ||
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end <= start ||
    end > textLength
  ) {
    return null;
  }
  return { start, end };
}

function normalizeWithIndexMap(input: string): {
  readonly normalized: string;
  readonly indexMap: readonly number[];
} {
  let normalized = "";
  const indexMap: number[] = [];
  let inWhitespace = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (ch === undefined) {
      continue;
    }
    if (/\s/.test(ch)) {
      if (!inWhitespace && normalized.length > 0) {
        normalized += " ";
        indexMap.push(i);
        inWhitespace = true;
      }
    } else {
      normalized += ch.toLowerCase();
      indexMap.push(i);
      inWhitespace = false;
    }
  }

  if (normalized.endsWith(" ")) {
    normalized = normalized.slice(0, -1);
    indexMap.pop();
  }

  return { normalized, indexMap };
}

export function findQuoteRange(
  text: string,
  quote: string,
): { readonly start: number; readonly end: number } | null {
  const trimmed = quote.trim();
  if (!trimmed || !text) {
    return null;
  }

  const exactIndex = text.indexOf(trimmed);
  if (exactIndex !== -1) {
    return { start: exactIndex, end: exactIndex + trimmed.length };
  }

  const lowerIndex = text.toLowerCase().indexOf(trimmed.toLowerCase());
  if (lowerIndex !== -1) {
    return { start: lowerIndex, end: lowerIndex + trimmed.length };
  }

  const { normalized: normalizedText, indexMap } = normalizeWithIndexMap(text);
  const { normalized: normalizedQuote } = normalizeWithIndexMap(trimmed);
  if (!normalizedQuote) {
    return null;
  }

  const matchStart = normalizedText.indexOf(normalizedQuote);
  if (matchStart === -1) {
    return null;
  }

  const matchEnd = matchStart + normalizedQuote.length - 1;
  const originalStart = indexMap[matchStart];
  const originalEnd = indexMap[matchEnd];
  if (originalStart === undefined || originalEnd === undefined) {
    return null;
  }

  return { start: originalStart, end: originalEnd + 1 };
}

export function resolveSegmentHighlights(
  segment: TranscriptSegment,
  claims: readonly Claim[],
  pendingMarks: readonly PendingMark[],
): ResolvedSegmentHighlights {
  const text = segment.text;
  const textLength = text.length;
  if (textLength === 0) {
    return { runs: [], hasSegmentFallbackAi: false };
  }

  const highlights: TextHighlight[] = [];
  let hasSegmentFallbackAi = false;

  for (const claim of claims) {
    if (claim.segment_id !== segment.id) {
      continue;
    }

    const kind =
      claim.origin === ClaimOrigins.JOURNALIST
        ? HighlightKinds.JOURNALIST
        : HighlightKinds.AI;

    const explicitRange = getValidRange(
      claim.start_offset,
      claim.end_offset,
      textLength,
    );
    if (explicitRange) {
      highlights.push({
        id: claim.id,
        kind,
        start: explicitRange.start,
        end: explicitRange.end,
      });
      continue;
    }

    const matched = findQuoteRange(text, claim.quote);
    if (matched) {
      highlights.push({
        id: claim.id,
        kind,
        start: matched.start,
        end: matched.end,
      });
    } else if (kind === HighlightKinds.AI) {
      hasSegmentFallbackAi = true;
    }
  }

  for (const mark of pendingMarks) {
    if (mark.segmentId !== segment.id) {
      continue;
    }
    const start = Math.max(0, Math.min(mark.startOffset, textLength));
    const end = Math.max(start, Math.min(mark.endOffset, textLength));
    if (end > start) {
      highlights.push({
        id: mark.id,
        kind: HighlightKinds.PENDING,
        start,
        end,
      });
    }
  }

  if (highlights.length === 0) {
    return {
      runs: [{ text, highlight: null }],
      hasSegmentFallbackAi,
    };
  }

  const boundaries = new Set<number>([0, textLength]);
  for (const highlight of highlights) {
    boundaries.add(highlight.start);
    boundaries.add(highlight.end);
  }
  const sortedPoints = Array.from(boundaries).sort((a, b) => a - b);

  const runs: TextRun[] = [];
  for (let i = 0; i < sortedPoints.length - 1; i += 1) {
    const start = sortedPoints[i];
    const end = sortedPoints[i + 1];
    if (start === undefined || end === undefined || end <= start) {
      continue;
    }

    let winner: TextHighlight | null = null;
    for (const candidate of highlights) {
      if (candidate.start <= start && candidate.end >= end) {
        if (
          !winner ||
          HIGHLIGHT_PRIORITY[candidate.kind] > HIGHLIGHT_PRIORITY[winner.kind]
        ) {
          winner = candidate;
        }
      }
    }

    const slice = text.slice(start, end);
    const previous = runs[runs.length - 1];
    if (
      previous &&
      previous.highlight?.id === winner?.id &&
      previous.highlight?.kind === winner?.kind
    ) {
      runs[runs.length - 1] = {
        text: previous.text + slice,
        highlight: previous.highlight,
      };
    } else {
      runs.push({ text: slice, highlight: winner });
    }
  }

  return { runs, hasSegmentFallbackAi };
}

export function readSelectionInElement(
  element: HTMLElement,
  segmentId: string,
): SegmentSelection | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  if (
    !element.contains(range.startContainer) ||
    !element.contains(range.endContainer)
  ) {
    return null;
  }

  const rawText = range.toString();
  const trimmed = rawText.trim();
  if (!trimmed) {
    return null;
  }

  const preRange = document.createRange();
  preRange.selectNodeContents(element);
  preRange.setEnd(range.startContainer, range.startOffset);
  const rawStart = preRange.toString().length;

  const leadingWhitespace = rawText.length - rawText.trimStart().length;
  const startOffset = rawStart + leadingWhitespace;
  const endOffset = startOffset + trimmed.length;

  return {
    segmentId,
    quote: trimmed,
    startOffset,
    endOffset,
  };
}

export function readSelectionInContainer(
  container: HTMLElement | null,
): SegmentSelection | null {
  if (!container) {
    return null;
  }
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const ancestor = range.commonAncestorContainer;
  const element =
    ancestor instanceof Element ? ancestor : ancestor.parentElement;
  const segmentEl = element?.closest<HTMLElement>("[data-segment-id]");
  if (!segmentEl || !container.contains(segmentEl)) {
    return null;
  }

  const segmentId = segmentEl.dataset.segmentId;
  if (!segmentId) {
    return null;
  }

  return readSelectionInElement(segmentEl, segmentId);
}
