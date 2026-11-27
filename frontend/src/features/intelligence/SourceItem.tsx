import { ExternalLink } from "lucide-react";

import type { ExternalSource } from "../../types/interview";
import { extractDomain, formatSourceDate, isSafeHttpUrl } from "./sourceFormat";

export interface SourceItemProps {
  readonly source: ExternalSource;
}

export function SourceItem({ source }: SourceItemProps) {
  const domain = extractDomain(source.url);
  const formattedDate = formatSourceDate(source.published_date);
  const safeHref = isSafeHttpUrl(source.url) ? source.url : undefined;

  const content = (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-snug text-text-primary group-hover:underline">
          {source.title}
        </span>
        {safeHref && (
          <ExternalLink
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted transition-colors group-hover:text-text-primary"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-xs text-text-muted">
        <span>{domain}</span>
        {formattedDate && (
          <>
            <span aria-hidden="true">·</span>
            <span>{formattedDate}</span>
          </>
        )}
      </div>

      {source.snippet && (
        <p className="line-clamp-2 text-xs leading-relaxed text-text-secondary">
          {source.snippet}
        </p>
      )}
    </div>
  );

  if (!safeHref) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface-canvas p-3">
        {content}
      </div>
    );
  }

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-border-subtle bg-surface-canvas p-3 transition-colors hover:border-border-strong"
    >
      {content}
    </a>
  );
}
