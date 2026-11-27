import { Card, CardPaddings, CardSurfaces, Skeleton, SkeletonVariants } from "../../components/ui";

export interface ProcessingSkeletonProps {
  readonly label?: string;
}

export function ProcessingSkeleton({
  label = "Transcribing interview and verifying claims...",
}: ProcessingSkeletonProps) {
  return (
    <main
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col gap-4 bg-surface-canvas p-4 lg:h-screen lg:overflow-hidden"
    >
      <header className="flex items-center justify-between px-2">
        <span className="text-base font-semibold tracking-tight text-text-primary">
          Griffier
        </span>
        <span className="text-xs text-text-secondary">{label}</span>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <Card
          surface={CardSurfaces.SUBTLE}
          padding={CardPaddings.MD}
          className="flex min-h-0 flex-col justify-between gap-6"
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <Skeleton variant={SkeletonVariants.LINE} className="max-w-44" />
              <div className="flex items-center gap-2">
                <Skeleton variant={SkeletonVariants.PILL} />
                <Skeleton variant={SkeletonVariants.PILL} />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Skeleton variant={SkeletonVariants.PILL} className="w-24" />
                    <Skeleton variant={SkeletonVariants.LINE} className="h-3 w-12" />
                  </div>
                  <Skeleton variant={SkeletonVariants.LINE} />
                  <Skeleton variant={SkeletonVariants.LINE} className="w-4/5" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-surface-canvas p-3">
            <Skeleton variant={SkeletonVariants.CIRCLE} className="h-control-sm w-control-sm shrink-0" />
            <Skeleton variant={SkeletonVariants.LINE} className="h-2" />
            <Skeleton variant={SkeletonVariants.LINE} className="h-3 w-16 shrink-0" />
          </div>
        </Card>

        <Card
          surface={CardSurfaces.SUBTLE}
          padding={CardPaddings.MD}
          className="flex min-h-0 flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <Skeleton variant={SkeletonVariants.LINE} className="h-3 w-24" />
            <Skeleton variant={SkeletonVariants.LINE} />
            <Skeleton variant={SkeletonVariants.LINE} className="w-5/6" />
          </div>

          <div className="flex flex-col gap-3">
            <Skeleton variant={SkeletonVariants.LINE} className="h-3 w-32" />
            <Skeleton variant={SkeletonVariants.BLOCK} className="h-20" />
            <Skeleton variant={SkeletonVariants.BLOCK} className="h-20" />
          </div>

          <div className="flex flex-col gap-3">
            <Skeleton variant={SkeletonVariants.LINE} className="h-3 w-28" />
            <Skeleton variant={SkeletonVariants.BLOCK} className="h-28" />
            <Skeleton variant={SkeletonVariants.BLOCK} className="h-28" />
          </div>
        </Card>
      </div>
    </main>
  );
}
