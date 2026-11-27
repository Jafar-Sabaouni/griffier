import type { ComponentPropsWithRef } from "react";

export const ButtonVariants = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  GHOST: "ghost",
  DANGER: "danger",
} as const;

export type ButtonVariant = (typeof ButtonVariants)[keyof typeof ButtonVariants];

export const ButtonSizes = {
  SM: "sm",
  MD: "md",
  LG: "lg",
} as const;

export type ButtonSize = (typeof ButtonSizes)[keyof typeof ButtonSizes];

export const ButtonShapes = {
  DEFAULT: "default",
  PILL: "pill",
  ICON: "icon",
} as const;

export type ButtonShape = (typeof ButtonShapes)[keyof typeof ButtonShapes];

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  [ButtonVariants.PRIMARY]:
    "bg-accent-primary text-text-inverse hover:bg-accent-primary-hover",
  [ButtonVariants.SECONDARY]:
    "bg-surface-canvas text-text-primary border border-border-subtle hover:bg-surface-hover",
  [ButtonVariants.GHOST]:
    "bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary",
  [ButtonVariants.DANGER]:
    "bg-status-danger-bg text-status-danger border border-border-subtle hover:bg-surface-hover",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  [ButtonSizes.SM]: "h-control-sm px-3 text-xs gap-1.5",
  [ButtonSizes.MD]: "h-control-md px-4 text-sm gap-2",
  [ButtonSizes.LG]: "h-control-lg px-6 text-sm gap-2.5",
};

const ICON_SIZE_CLASSES: Record<ButtonSize, string> = {
  [ButtonSizes.SM]: "h-control-sm w-control-sm p-0",
  [ButtonSizes.MD]: "h-control-md w-control-md p-0",
  [ButtonSizes.LG]: "h-control-lg w-control-lg p-0",
};

const DEFAULT_RADIUS_CLASSES: Record<ButtonSize, string> = {
  [ButtonSizes.SM]: "rounded-sm",
  [ButtonSizes.MD]: "rounded-md",
  [ButtonSizes.LG]: "rounded-lg",
};

export interface ButtonProps extends ComponentPropsWithRef<"button"> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly shape?: ButtonShape;
}

export function Button({
  variant = ButtonVariants.PRIMARY,
  size = ButtonSizes.MD,
  shape = ButtonShapes.DEFAULT,
  type = "button",
  className = "",
  ...rest
}: ButtonProps) {
  const sizeClass =
    shape === ButtonShapes.ICON ? ICON_SIZE_CLASSES[size] : SIZE_CLASSES[size];
  const radiusClass =
    shape === ButtonShapes.DEFAULT
      ? DEFAULT_RADIUS_CLASSES[size]
      : "rounded-pill";

  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
        VARIANT_CLASSES[variant],
        sizeClass,
        radiusClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}
