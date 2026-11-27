import { BookmarkPlus, CheckCheck } from "lucide-react";

import { Button, ButtonSizes, ButtonVariants } from "../../components/ui";
import type { SegmentSelection } from "./highlights";

export interface PendingMarksBarProps {
  readonly activeSelection: SegmentSelection | null;
  readonly pendingCount: number;
  readonly isChecking: boolean;
  readonly error: string | null;
  readonly onMarkSelection: (selection: SegmentSelection) => void;
  readonly onCheckPending: () => void;
}

export function PendingMarksBar({
  activeSelection,
  pendingCount,
  isChecking,
  error,
  onMarkSelection,
  onCheckPending,
}: PendingMarksBarProps) {
  if (!activeSelection && pendingCount === 0 && !error) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
      {error && (
        <p
          role="alert"
          className="rounded-md bg-status-danger-bg px-3 py-2 text-xs text-status-danger"
        >
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {activeSelection && (
            <Button
              variant={ButtonVariants.SECONDARY}
              size={ButtonSizes.SM}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onMarkSelection(activeSelection)}
              disabled={isChecking}
            >
              <BookmarkPlus className="h-3.5 w-3.5" aria-hidden="true" />
              Mark to fact-check
            </Button>
          )}
          {pendingCount > 0 && !activeSelection && (
            <span className="text-xs text-text-muted">
              Click any marked passage to remove it
            </span>
          )}
        </div>

        {pendingCount > 0 && (
          <Button
            variant={ButtonVariants.PRIMARY}
            size={ButtonSizes.SM}
            onClick={onCheckPending}
            disabled={isChecking}
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {isChecking
              ? "Checking passages..."
              : `Check marked passages (${pendingCount})`}
          </Button>
        )}
      </div>
    </div>
  );
}
