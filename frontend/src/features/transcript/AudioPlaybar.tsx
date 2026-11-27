import { Pause, Play, VolumeX } from "lucide-react";

import {
  Button,
  ButtonShapes,
  ButtonSizes,
  ButtonVariants,
} from "../../components/ui";
import { formatTimestampMs } from "./formatTime";

export interface AudioPlaybarProps {
  readonly currentTimeMs: number;
  readonly durationMs: number;
  readonly isPlaying: boolean;
  readonly loading: boolean;
  readonly unavailable: boolean;
  readonly onTogglePlayback: () => void;
  readonly onSeek: (timeMs: number) => void;
}

export function AudioPlaybar({
  currentTimeMs,
  durationMs,
  isPlaying,
  loading,
  unavailable,
  onTogglePlayback,
  onSeek,
}: AudioPlaybarProps) {
  if (unavailable) {
    return (
      <div className="flex items-center gap-2 pt-2 text-xs text-text-muted">
        <VolumeX className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Audio playback is unavailable for this session.</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 pt-2">
      <Button
        variant={ButtonVariants.PRIMARY}
        size={ButtonSizes.SM}
        shape={ButtonShapes.ICON}
        aria-label={isPlaying ? "Pause audio" : "Play audio"}
        disabled={loading}
        onClick={onTogglePlayback}
        className="shrink-0"
      >
        {isPlaying ? (
          <Pause className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
        ) : (
          <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
        )}
      </Button>

      <input
        type="range"
        min={0}
        max={Math.max(durationMs, 1)}
        value={Math.min(currentTimeMs, Math.max(durationMs, 1))}
        onChange={(event) => onSeek(Number(event.target.value))}
        aria-label="Audio timeline"
        className="h-1.5 w-full cursor-pointer accent-accent-primary"
      />

      <span className="shrink-0 font-mono text-xs text-text-secondary tabular-nums">
        {formatTimestampMs(currentTimeMs)} / {formatTimestampMs(durationMs)}
      </span>
    </div>
  );
}
