import type { ComponentPropsWithRef } from "react";

export const InputSizes = {
  SM: "sm",
  MD: "md",
  LG: "lg",
} as const;

export type InputSize = (typeof InputSizes)[keyof typeof InputSizes];

const SIZE_CLASSES: Record<InputSize, string> = {
  [InputSizes.SM]: "h-control-sm px-2.5 text-xs rounded-sm",
  [InputSizes.MD]: "h-control-md px-3 text-sm rounded-md",
  [InputSizes.LG]: "h-control-lg px-4 text-sm rounded-lg",
};

export interface InputProps
  extends Omit<ComponentPropsWithRef<"input">, "size"> {
  readonly size?: InputSize;
  readonly invalid?: boolean;
}

export function Input({
  size = InputSizes.MD,
  invalid = false,
  className = "",
  ...rest
}: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={[
        "w-full border bg-surface-canvas text-text-primary placeholder:text-text-muted transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
        "disabled:pointer-events-none disabled:bg-surface-subtle disabled:opacity-60",
        invalid ? "border-status-danger" : "border-border-subtle hover:border-border-strong",
        SIZE_CLASSES[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}
