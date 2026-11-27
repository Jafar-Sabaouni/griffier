import type { ComponentPropsWithRef } from "react";

export const BadgeVariants = {
  NEUTRAL: "neutral",
  SOLID: "solid",
  AI: "ai",
  JOURNALIST: "journalist",
  DANGER: "danger",
} as const;

export type BadgeVariant = (typeof BadgeVariants)[keyof typeof BadgeVariants];

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  [BadgeVariants.NEUTRAL]: "bg-surface-raised text-text-secondary",
  [BadgeVariants.SOLID]: "bg-surface-inverse text-text-inverse",
  [BadgeVariants.AI]:
    "bg-mark-ai-bg text-text-primary border border-mark-ai-underline",
  [BadgeVariants.JOURNALIST]:
    "bg-mark-journalist-bg text-text-primary border border-mark-journalist-border",
  [BadgeVariants.DANGER]: "bg-status-danger-bg text-status-danger",
};

export interface BadgeProps extends ComponentPropsWithRef<"span"> {
  readonly variant?: BadgeVariant;
}

export function Badge({
  variant = BadgeVariants.NEUTRAL,
  className = "",
  ...rest
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium tracking-tight",
        VARIANT_CLASSES[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}
