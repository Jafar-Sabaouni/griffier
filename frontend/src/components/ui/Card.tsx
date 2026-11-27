import type { ComponentPropsWithRef } from "react";

export const CardSurfaces = {
  CANVAS: "canvas",
  SUBTLE: "subtle",
  RAISED: "raised",
} as const;

export type CardSurface = (typeof CardSurfaces)[keyof typeof CardSurfaces];

export const CardPaddings = {
  SM: "sm",
  MD: "md",
  LG: "lg",
} as const;

export type CardPadding = (typeof CardPaddings)[keyof typeof CardPaddings];

const SURFACE_CLASSES: Record<CardSurface, string> = {
  [CardSurfaces.CANVAS]: "bg-surface-canvas border border-border-subtle",
  [CardSurfaces.SUBTLE]: "bg-surface-subtle",
  [CardSurfaces.RAISED]: "bg-surface-raised",
};

const PADDING_CLASSES: Record<CardPadding, string> = {
  [CardPaddings.SM]: "p-2 rounded-xl",
  [CardPaddings.MD]: "p-4 rounded-2xl",
  [CardPaddings.LG]: "p-6 rounded-2xl",
};

export interface CardProps extends ComponentPropsWithRef<"div"> {
  readonly surface?: CardSurface;
  readonly padding?: CardPadding;
  readonly active?: boolean;
}

export function Card({
  surface = CardSurfaces.SUBTLE,
  padding = CardPaddings.MD,
  active = false,
  className = "",
  ...rest
}: CardProps) {
  return (
    <div
      className={[
        SURFACE_CLASSES[surface],
        PADDING_CLASSES[padding],
        active ? "ring-1 ring-focus-ring" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}
