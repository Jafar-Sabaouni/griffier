import { AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";

import type { Claim, Interview } from "../../types/interview";
import { ClaimCard } from "./ClaimCard";
import { SourceItem } from "./SourceItem";

export interface IntelligencePaneProps {
  readonly interview: Interview;
  readonly focusedClaimId: string | null;
  readonly scrollToFocusedSeq: number;
  readonly dismissingClaimIds: ReadonlySet<string>;
  readonly dismissError: string | null;
  readonly onFocusClaim: (claim: Claim) => void;
  readonly onDismissClaim: (claimId: string) => void;
}

export function IntelligencePane({
  interview,
  focusedClaimId,
  scrollToFocusedSeq,
  dismissingClaimIds,
  dismissError,
  onFocusClaim,
  onDismissClaim,
}: IntelligencePaneProps) {
  const claimRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const segmentStartById = new Map<string, number>();
  for (const segment of interview.segments) {
    segmentStartById.set(segment.id, segment.start_ms);
  }

  useEffect(() => {
    if (scrollToFocusedSeq === 0 || !focusedClaimId) {
      return;
    }
    const element = claimRefs.current.get(focusedClaimId);
    element?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [focusedClaimId, scrollToFocusedSeq]);

  return (
    <section
      aria-label="Intelligence"
      className="flex min-h-0 flex-col rounded-2xl bg-surface-subtle p-4"
    >
      <header className="flex h-7 items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Intelligence
        </h2>
        <span className="font-mono text-xs text-text-muted">
          {interview.claims.length}{" "}
          {interview.claims.length === 1 ? "claim" : "claims"}
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto py-4 pr-1">
        {interview.warnings.length > 0 && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-xl border border-border-subtle bg-surface-canvas px-3.5 py-2.5 text-xs text-text-secondary"
          >
            <AlertTriangle
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <ul className="flex flex-col gap-1">
              {interview.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {dismissError && (
          <p
            role="alert"
            className="rounded-md bg-status-danger-bg px-3 py-2 text-xs text-status-danger"
          >
            {dismissError}
          </p>
        )}

        {interview.summary && (
          <section aria-label="Summary" className="flex flex-col gap-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Summary
            </h3>
            <p className="text-sm leading-relaxed text-text-primary">
              {interview.summary}
            </p>
          </section>
        )}

        <section aria-label="Fact-check list" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Fact-check list
            </h3>
            <span className="font-mono text-xs text-text-muted">
              {interview.claims.length}
            </span>
          </div>

          {interview.claims.length === 0 ? (
            <p className="rounded-xl border border-border-subtle bg-surface-canvas px-4 py-3 text-xs text-text-muted">
              No claims flagged yet. Select any passage in the transcript to
              mark it for fact-checking.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {interview.claims.map((claim) => (
                <div
                  key={claim.id}
                  ref={(node) => {
                    if (node) {
                      claimRefs.current.set(claim.id, node);
                    } else {
                      claimRefs.current.delete(claim.id);
                    }
                  }}
                >
                  <ClaimCard
                    claim={claim}
                    segmentStartMs={segmentStartById.get(claim.segment_id) ?? null}
                    isFocused={claim.id === focusedClaimId}
                    isDismissing={dismissingClaimIds.has(claim.id)}
                    onFocus={onFocusClaim}
                    onDismiss={onDismissClaim}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section aria-label="External sources" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              External sources
            </h3>
            <span className="font-mono text-xs text-text-muted">
              {interview.sources.length}
            </span>
          </div>

          {interview.sources.length === 0 ? (
            <p className="rounded-xl border border-border-subtle bg-surface-canvas px-4 py-3 text-xs text-text-muted">
              No external sources were retrieved for this interview.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {interview.sources.map((source, index) => (
                <SourceItem key={`${source.url}-${index}`} source={source} />
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
