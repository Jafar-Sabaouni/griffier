import type { ComponentPropsWithRef } from "react";

export const AudioWaveformSizes = {
  SM: "sm",
  MD: "md",
  LG: "lg",
} as const;

export type AudioWaveformSize =
  (typeof AudioWaveformSizes)[keyof typeof AudioWaveformSizes];

const CONTAINER_HEIGHT_CLASSES: Record<AudioWaveformSize, string> = {
  [AudioWaveformSizes.SM]: "h-control-sm gap-1",
  [AudioWaveformSizes.MD]: "h-control-md gap-1.5",
  [AudioWaveformSizes.LG]: "h-control-lg gap-2",
};

const BAR_WIDTH_CLASSES: Record<AudioWaveformSize, string> = {
  [AudioWaveformSizes.SM]: "w-1",
  [AudioWaveformSizes.MD]: "w-1.5",
  [AudioWaveformSizes.LG]: "w-1.5",
};

const MIN_BAR_PERCENT = 15;
const MAX_BAR_PERCENT = 100;

function toHeightPercent(level: number): number {
  const clamped = Math.min(1, Math.max(0, level));
  return Math.round(
    MIN_BAR_PERCENT + clamped * (MAX_BAR_PERCENT - MIN_BAR_PERCENT),
  );
}

function normalizeBars(
  levels: readonly number[],
  barCount?: number,
): readonly number[] {
  if (barCount === undefined || barCount <= 0) {
    return levels;
  }
  if (levels.length >= barCount) {
    return levels.slice(levels.length - barCount);
  }
  return [...Array.from({ length: barCount - levels.length }, () => 0), ...levels];
}

export interface AudioWaveformProps extends ComponentPropsWithRef<"div"> {
  readonly levels: readonly number[];
  readonly barCount?: number;
  readonly active?: boolean;
  readonly size?: AudioWaveformSize;
  readonly label?: string;
}

export function AudioWaveform({
  levels,
  barCount,
  active = true,
  size = AudioWaveformSizes.MD,
  label = "Audio input level",
  className = "",
  ...rest
}: AudioWaveformProps) {
  const bars = normalizeBars(levels, barCount);

  return (
    <div
      role="img"
      aria-label={label}
      className={[
        "inline-flex items-center",
        CONTAINER_HEIGHT_CLASSES[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {bars.map((level, index) => (
        <span
          key={index}
          style={{ height: `${toHeightPercent(active ? level : 0)}%` }}
          className={[
            "rounded-pill transition-[height] duration-75",
            BAR_WIDTH_CLASSES[size],
            active ? "bg-accent-primary" : "bg-border-strong",
          ].join(" ")}
        />
      ))}
    </div>
  );
}
