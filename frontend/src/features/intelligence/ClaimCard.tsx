import { ExternalLink, X } from "lucide-react";

import {
  Badge,
  BadgeVariants,
  Button,
  ButtonShapes,
  ButtonSizes,
  ButtonVariants,
  Card,
  CardPaddings,
  CardSurfaces,
} from "../../components/ui";
import type { BadgeVariant } from "../../components/ui";
import { ClaimOrigins, ClaimVerdicts } from "../../types/interview";
import type { Claim, ClaimVerdict } from "../../types/interview";
import { formatTimestampMs } from "../transcript/formatTime";
import { extractDomain, isSafeHttpUrl } from "./sourceFormat";

const VERDICT_CONFIG: Readonly<
  Record<ClaimVerdict, { readonly label: string; readonly variant: BadgeVariant }>
> = {
  [ClaimVerdicts.SUPPORTED]: {
    label: "Supported",
    variant: BadgeVariants.SOLID,
  },
  [ClaimVerdicts.CONTRADICTED]: {
    label: "Contradicted",
    variant: BadgeVariants.DANGER,
  },
  [ClaimVerdicts.NEEDS_CONTEXT]: {
    label: "Needs context",
    variant: BadgeVariants.NEUTRAL,
  },
  [ClaimVerdicts.UNVERIFIED]: {
    label: "Unverified",
    variant: BadgeVariants.NEUTRAL,
  },
};

export interface ClaimCardProps {
  readonly claim: Claim;
  readonly segmentStartMs: number | null;
  readonly isFocused: boolean;
  readonly isDismissing: boolean;
  readonly onFocus: (claim: Claim) => void;
  readonly onDismiss: (claimId: string) => void;
}

export function ClaimCard({
  claim,
  segmentStartMs,
  isFocused,
  isDismissing,
  onFocus,
  onDismiss,
}: ClaimCardProps) {
  const verdictMeta = VERDICT_CONFIG[claim.verdict];
  const isJournalist = claim.origin === ClaimOrigins.JOURNALIST;

  return (
    <Card
      surface={CardSurfaces.CANVAS}
      padding={CardPaddings.MD}
      active={isFocused}
      data-claim-id={claim.id}
      onClick={() => onFocus(claim)}
      className="flex cursor-pointer flex-col gap-3 transition-colors hover:border-border-strong"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant={
              isJournalist ? BadgeVariants.JOURNALIST : BadgeVariants.AI
            }
          >
            {isJournalist ? "Marked" : "AI"}
          </Badge>
          <Badge variant={verdictMeta.variant}>{verdictMeta.label}</Badge>
        </div>

        <Button
          variant={ButtonVariants.GHOST}
          size={ButtonSizes.SM}
          shape={ButtonShapes.ICON}
          aria-label={`Dismiss claim by ${claim.speaker}`}
          disabled={isDismissing}
          onClick={(event) => {
            event.stopPropagation();
            onDismiss(claim.id);
          }}
          className="-mr-1.5 -mt-1.5 shrink-0"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onFocus(claim);
          }}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xs text-left transition-colors hover:text-text-primary"
        >
          <span className="text-xs font-semibold text-text-primary">
            {claim.speaker}
          </span>
          {segmentStartMs !== null && (
            <span className="font-mono text-xs text-text-muted">
              {formatTimestampMs(segmentStartMs)}
            </span>
          )}
        </button>
      </div>

      <blockquote className="border-l-2 border-border-strong pl-3 text-sm font-medium leading-snug text-text-primary">
        &ldquo;{claim.quote}&rdquo;
      </blockquote>

      <p className="text-sm leading-relaxed text-text-secondary">
        {claim.explanation}
      </p>

      {claim.sources.length > 0 && (
        <ul className="flex flex-col gap-1.5 border-t border-border-subtle pt-2.5">
          {claim.sources.map((source, index) => {
            const safeHref = isSafeHttpUrl(source.url) ? source.url : undefined;
            const domain = extractDomain(source.url);
            return (
              <li
                key={`${claim.id}-source-${index}`}
                className="flex items-baseline gap-1.5 text-xs"
              >
                <span className="shrink-0 font-mono text-text-muted">
                  [{index + 1}]
                </span>
                {safeHref ? (
                  <a
                    href={safeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="inline-flex min-w-0 items-center gap-1 text-text-primary underline-offset-2 hover:underline"
                  >
                    <span className="truncate">{source.title}</span>
                    <span className="shrink-0 font-mono text-text-muted">
                      ({domain})
                    </span>
                    <ExternalLink
                      className="h-3 w-3 shrink-0 text-text-muted"
                      aria-hidden="true"
                    />
                  </a>
                ) : (
                  <span className="truncate text-text-secondary">
                    {source.title}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
