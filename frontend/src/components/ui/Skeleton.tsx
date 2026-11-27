import type { ComponentPropsWithRef } from "react";

export const SkeletonVariants = {
  LINE: "line",
  BLOCK: "block",
  PILL: "pill",
  CIRCLE: "circle",
} as const;

export type SkeletonVariant =
  (typeof SkeletonVariants)[keyof typeof SkeletonVariants];

const VARIANT_CLASSES: Record<SkeletonVariant, string> = {
  [SkeletonVariants.LINE]: "h-4 w-full rounded-sm",
  [SkeletonVariants.BLOCK]: "h-24 w-full rounded-md",
  [SkeletonVariants.PILL]: "h-6 w-20 rounded-pill",
  [SkeletonVariants.CIRCLE]: "h-control-md w-control-md rounded-pill",
};

export interface SkeletonProps extends ComponentPropsWithRef<"div"> {
  readonly variant?: SkeletonVariant;
}

export function Skeleton({
  variant = SkeletonVariants.LINE,
  className = "",
  ...rest
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={[
        "animate-pulse bg-surface-raised",
        VARIANT_CLASSES[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}
