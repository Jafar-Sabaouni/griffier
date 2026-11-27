import { Pencil } from "lucide-react";

import {
  Button,
  ButtonShapes,
  ButtonSizes,
  ButtonVariants,
} from "../../components/ui";
import type { SpeakerSummary } from "./speakers";

export interface SpeakersSidebarProps {
  readonly speakers: readonly SpeakerSummary[];
  readonly onEditSpeaker: (speaker: string) => void;
}

export function SpeakersSidebar({
  speakers,
  onEditSpeaker,
}: SpeakersSidebarProps) {
  return (
    <aside
      aria-label="Speakers"
      className="flex min-h-0 flex-col gap-3 rounded-2xl bg-surface-subtle p-4 lg:w-60 lg:shrink-0 lg:overflow-y-auto"
    >
      <header className="flex h-7 items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Speakers
        </h2>
        <span className="font-mono text-xs text-text-muted">
          {speakers.length}
        </span>
      </header>

      {speakers.length === 0 ? (
        <p className="text-xs text-text-muted">No speakers detected.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {speakers.map((speaker) => (
            <li
              key={speaker.name}
              className="flex items-center justify-between gap-2 rounded-xl bg-surface-canvas px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">
                  {speaker.name}
                </p>
                <p className="text-xs text-text-muted">
                  {speaker.segmentCount}{" "}
                  {speaker.segmentCount === 1 ? "segment" : "segments"}
                </p>
              </div>
              <Button
                variant={ButtonVariants.GHOST}
                size={ButtonSizes.SM}
                shape={ButtonShapes.ICON}
                aria-label={`Rename ${speaker.name}`}
                onClick={() => onEditSpeaker(speaker.name)}
                className="shrink-0"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
