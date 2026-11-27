import { ArrowLeft } from "lucide-react";

import { Skeleton, SkeletonVariants } from "../../components/ui";

export interface ProcessingSkeletonProps {
  readonly label?: string;
}

export function ProcessingSkeleton({
  label = "Transcribing interview and verifying claims...",
}: ProcessingSkeletonProps) {
  return (
    <div className="flex min-h-screen flex-col gap-3 bg-surface-canvas p-4 lg:h-screen lg:overflow-hidden">
      <header className="flex items-center justify-between gap-4 px-1">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight text-text-primary">
            <ArrowLeft className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <span>Griffier</span>
          </span>
          <span className="text-text-muted" aria-hidden="true">
            /
          </span>
          <Skeleton
            variant={SkeletonVariants.LINE}
            className="h-3.5 max-w-40"
          />
        </div>

        <span
          role="status"
          aria-live="polite"
          className="shrink-0 text-xs text-text-secondary"
        >
          {label}
        </span>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <aside
          aria-hidden="true"
          className="flex min-h-0 flex-col gap-3 rounded-2xl bg-surface-subtle p-4 lg:w-60 lg:shrink-0"
        >
          <header className="flex h-7 items-center justify-between gap-3 border-b border-border-subtle pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Speakers
            </span>
            <Skeleton variant={SkeletonVariants.LINE} className="h-3 max-w-4" />
          </header>

          <ul className="flex flex-col gap-1.5">
            {Array.from({ length: 3 }, (_, index) => (
              <li
                key={index}
                className="flex items-center justify-between gap-2 rounded-xl bg-surface-canvas px-3 py-2"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Skeleton
                    variant={SkeletonVariants.LINE}
                    className="h-3.5 max-w-24"
                  />
                  <Skeleton
                    variant={SkeletonVariants.LINE}
                    className="h-3 max-w-16"
                  />
                </div>
                <Skeleton
                  variant={SkeletonVariants.CIRCLE}
                  className="max-h-8 max-w-8 shrink-0"
                />
              </li>
            ))}
          </ul>
        </aside>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
          <section
            aria-hidden="true"
            className="flex min-h-0 flex-col rounded-2xl bg-surface-subtle p-4"
          >
            <header className="flex h-7 items-center justify-between gap-3 border-b border-border-subtle pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Transcript
              </span>
              <Skeleton variant={SkeletonVariants.LINE} className="h-3 max-w-16" />
            </header>

            <div className="min-h-0 flex-1 overflow-hidden py-4 pr-1">
              <ol className="flex flex-col gap-6">
                {Array.from({ length: 5 }, (_, index) => (
                  <li key={index} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Skeleton
                        variant={SkeletonVariants.LINE}
                        className="h-4 max-w-28"
                      />
                      <Skeleton
                        variant={SkeletonVariants.LINE}
                        className="h-3 max-w-10"
                      />
                    </div>
                    <Skeleton
                      variant={SkeletonVariants.LINE}
                      className="h-5"
                    />
                    <Skeleton
                      variant={SkeletonVariants.LINE}
                      className="h-5 max-w-[80%]"
                    />
                  </li>
                ))}
              </ol>
            </div>

            <div className="pt-3">
              <div className="flex items-center gap-3 pt-2">
                <Skeleton
                  variant={SkeletonVariants.CIRCLE}
                  className="max-h-8 max-w-8 shrink-0"
                />
                <Skeleton
                  variant={SkeletonVariants.LINE}
                  className="h-1.5 flex-1"
                />
                <Skeleton
                  variant={SkeletonVariants.LINE}
                  className="h-3 max-w-16 shrink-0"
                />
              </div>
            </div>
          </section>

          <section
            aria-hidden="true"
            className="flex min-h-0 flex-col rounded-2xl bg-surface-subtle p-4"
          >
            <header className="flex h-7 items-center justify-between gap-3 border-b border-border-subtle pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Intelligence
              </span>
              <Skeleton variant={SkeletonVariants.LINE} className="h-3 max-w-12" />
            </header>

            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden py-4 pr-1">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Summary
                </span>
                <Skeleton variant={SkeletonVariants.LINE} className="h-3.5" />
                <Skeleton
                  variant={SkeletonVariants.LINE}
                  className="h-3.5 max-w-[85%]"
                />
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Fact-check list
                </span>
                {Array.from({ length: 2 }, (_, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface-canvas p-4"
                  >
                    <div className="flex items-center gap-1.5">
                      <Skeleton
                        variant={SkeletonVariants.PILL}
                        className="h-5 max-w-12"
                      />
                      <Skeleton
                        variant={SkeletonVariants.PILL}
                        className="h-5 max-w-20"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton
                        variant={SkeletonVariants.LINE}
                        className="h-3 max-w-20"
                      />
                      <Skeleton
                        variant={SkeletonVariants.LINE}
                        className="h-3 max-w-10"
                      />
                    </div>
                    <Skeleton
                      variant={SkeletonVariants.LINE}
                      className="h-3.5 max-w-[92%]"
                    />
                    <Skeleton
                      variant={SkeletonVariants.LINE}
                      className="h-3 max-w-[80%]"
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  External sources
                </span>
                {Array.from({ length: 2 }, (_, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface-canvas p-3"
                  >
                    <Skeleton
                      variant={SkeletonVariants.LINE}
                      className="h-3.5 max-w-[75%]"
                    />
                    <Skeleton
                      variant={SkeletonVariants.LINE}
                      className="h-3 max-w-[35%]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
