import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

import { Badge, BadgeVariants } from "../../components/ui";

export interface WorkspaceHeaderProps {
  readonly title: string;
  readonly segmentCount: number;
  readonly claimCount: number;
}

export function WorkspaceHeader({
  title,
  segmentCount,
  claimCount,
}: WorkspaceHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 px-1">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          to="/"
          className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight text-text-primary transition-colors hover:text-text-secondary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Griffier</span>
        </Link>
        <span className="text-text-muted" aria-hidden="true">
          /
        </span>
        <h1 className="truncate text-sm font-medium text-text-secondary">
          {title}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={BadgeVariants.NEUTRAL}>{segmentCount} segments</Badge>
        <Badge variant={BadgeVariants.NEUTRAL}>{claimCount} claims</Badge>
      </div>
    </header>
  );
}
