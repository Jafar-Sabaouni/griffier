import { useRef, useSyncExternalStore } from "react";
import type { RefObject } from "react";

import { readSelectionInContainer } from "./highlights";
import type { SegmentSelection } from "./highlights";

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

export function useContainerSelection(
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
