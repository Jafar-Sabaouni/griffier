import { Mic, MoreHorizontal, Square, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";

import {
  AudioWaveform,
  AudioWaveformSizes,
  Badge,
  BadgeVariants,
  Button,
  ButtonShapes,
  ButtonSizes,
  ButtonVariants,
  Card,
  CardPaddings,
  CardSurfaces,
  ContextMenu,
  Input,
  InputSizes,
  Skeleton,
  SkeletonVariants,
} from "../components/ui";
import type { ContextMenuPosition } from "../components/ui";
import { useAudioLevels } from "../hooks/useAudioLevels";

export function PrimitivesPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<ContextMenuPosition>({
    x: 0,
    y: 0,
  });
  const [lastAction, setLastAction] = useState<string>("None yet");
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const liveLevels = useAudioLevels(micStream);

  const stopMic = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    setMicStream(null);
  };

  const toggleMic = async () => {
    if (micStreamRef.current) {
      stopMic();
      return;
    }
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setMicStream(stream);
    } catch {
      setMicError("Microphone permission denied or unavailable.");
    }
  };

  useEffect(() => {
    return () => {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
    };
  }, []);

  const openMenuAt = (x: number, y: number) => {
    setMenuPosition({ x, y });
    setMenuOpen(true);
  };

  const handleContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    openMenuAt(event.clientX, event.clientY);
  };

  return (
    <main className="min-h-screen bg-surface-canvas px-6 py-8 text-text-primary">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="border-b border-border-subtle pb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Griffier UI Primitives
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Monochrome editorial token system and reusable component primitives.
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
            Buttons & Control Parity
          </h2>
          <Card surface={CardSurfaces.SUBTLE} padding={CardPaddings.MD}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant={ButtonVariants.PRIMARY}>Primary</Button>
                <Button variant={ButtonVariants.SECONDARY}>Secondary</Button>
                <Button variant={ButtonVariants.GHOST}>Ghost</Button>
                <Button variant={ButtonVariants.DANGER}>Danger</Button>
                <Button variant={ButtonVariants.PRIMARY} disabled>
                  Disabled
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size={ButtonSizes.SM}>Small</Button>
                <Button size={ButtonSizes.MD}>Medium</Button>
                <Button size={ButtonSizes.LG} shape={ButtonShapes.PILL}>
                  <Mic className="h-4 w-4" aria-hidden="true" />
                  Start recording
                </Button>
                <Button
                  variant={ButtonVariants.SECONDARY}
                  size={ButtonSizes.LG}
                  shape={ButtonShapes.ICON}
                  aria-label="Upload audio"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
            Inputs
          </h2>
          <Card surface={CardSurfaces.SUBTLE} padding={CardPaddings.MD}>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Input
                  size={InputSizes.SM}
                  defaultValue="Speaker A"
                  aria-label="Rename speaker"
                  className="max-w-56"
                />
                <Button variant={ButtonVariants.PRIMARY} size={ButtonSizes.SM}>
                  Save
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  size={InputSizes.MD}
                  placeholder="Interview title..."
                  aria-label="Interview title"
                />
                <Input
                  size={InputSizes.MD}
                  invalid
                  defaultValue=""
                  placeholder="Invalid state"
                  aria-label="Invalid input example"
                />
              </div>
            </div>
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
            Badges
          </h2>
          <Card surface={CardSurfaces.SUBTLE} padding={CardPaddings.MD}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={BadgeVariants.NEUTRAL}>Speaker A</Badge>
              <Badge variant={BadgeVariants.SOLID}>Supported</Badge>
              <Badge variant={BadgeVariants.AI}>AI</Badge>
              <Badge variant={BadgeVariants.JOURNALIST}>Marked</Badge>
              <Badge variant={BadgeVariants.DANGER}>Contradicted</Badge>
            </div>
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
            Cards & Surfaces
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card surface={CardSurfaces.CANVAS} padding={CardPaddings.MD}>
              <p className="text-sm font-medium text-text-primary">Canvas</p>
              <p className="mt-1 text-xs text-text-secondary">
                Subtle border on matching canvas background.
              </p>
            </Card>
            <Card surface={CardSurfaces.SUBTLE} padding={CardPaddings.MD}>
              <p className="text-sm font-medium text-text-primary">Subtle</p>
              <p className="mt-1 text-xs text-text-secondary">
                Surface contrast without heavy borders.
              </p>
            </Card>
            <Card
              surface={CardSurfaces.RAISED}
              padding={CardPaddings.MD}
              active
            >
              <p className="text-sm font-medium text-text-primary">
                Raised (Active)
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Selected card with crisp focus ring.
              </p>
            </Card>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
            Transcript Playback & Fact-Check Marks
          </h2>
          <Card surface={CardSurfaces.CANVAS} padding={CardPaddings.MD}>
            <div className="flex flex-col gap-3 text-base leading-relaxed">
              <p className="text-transcript-inactive">
                Inactive transcript segment with an{" "}
                <mark className="rounded-sm bg-mark-ai-bg px-1 text-inherit border-b border-dashed border-mark-ai-underline">
                  AI-suggested factual claim
                </mark>{" "}
                inside it.
              </p>
              <p className="text-transcript-active">
                Active spoken segment shifts to crisp ink black, while a{" "}
                <mark className="rounded-sm bg-mark-journalist-bg px-1 text-inherit border-b-2 border-mark-journalist-border">
                  journalist-marked passage
                </mark>{" "}
                remains unmistakably distinct.
              </p>
            </div>
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
            Context Menu
          </h2>
          <Card
            surface={CardSurfaces.SUBTLE}
            padding={CardPaddings.MD}
            onContextMenu={handleContextMenu}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Right-click anywhere in this box to open the ContextMenu.
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  Last selected action: {lastAction}
                </p>
              </div>
              <Button
                variant={ButtonVariants.SECONDARY}
                size={ButtonSizes.SM}
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  openMenuAt(rect.left, rect.bottom + 8);
                }}
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                Open menu
              </Button>
            </div>
          </Card>
          <ContextMenu
            open={menuOpen}
            position={menuPosition}
            onClose={() => setMenuOpen(false)}
            items={[
              {
                id: "mark",
                label: "Mark to fact-check",
                onSelect: () => setLastAction("Mark to fact-check"),
              },
              {
                id: "copy",
                label: "Copy quote",
                onSelect: () => setLastAction("Copy quote"),
              },
            ]}
          />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
            Audio Waveform
          </h2>
          <Card surface={CardSurfaces.SUBTLE} padding={CardPaddings.MD}>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex flex-wrap items-center gap-8">
                  <div className="flex items-center gap-3">
                    <AudioWaveform
                      size={AudioWaveformSizes.MD}
                      levels={
                        micStream
                          ? liveLevels
                          : [
                              0.2, 0.5, 0.85, 0.4, 0.95, 0.7, 0.35, 0.8, 0.6,
                              0.9, 0.45, 0.25,
                            ]
                      }
                      active
                    />
                    <span className="font-mono text-xs text-text-secondary">
                      {micStream ? "Live" : "Sample"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AudioWaveform
                      size={AudioWaveformSizes.MD}
                      levels={liveLevels}
                      active={false}
                    />
                    <span className="text-xs text-text-muted">Idle</span>
                  </div>
                </div>
                <Button
                  variant={
                    micStream
                      ? ButtonVariants.DANGER
                      : ButtonVariants.SECONDARY
                  }
                  size={ButtonSizes.SM}
                  onClick={() => {
                    void toggleMic();
                  }}
                >
                  {micStream ? (
                    <>
                      <Square className="h-3.5 w-3.5" aria-hidden="true" />
                      Stop mic
                    </>
                  ) : (
                    <>
                      <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                      Test mic
                    </>
                  )}
                </Button>
              </div>
              {micError && (
                <p className="text-xs text-status-danger">{micError}</p>
              )}
            </div>
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
            Skeletons
          </h2>
          <Card surface={CardSurfaces.SUBTLE} padding={CardPaddings.MD}>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Skeleton variant={SkeletonVariants.CIRCLE} />
                <Skeleton variant={SkeletonVariants.PILL} />
              </div>
              <Skeleton variant={SkeletonVariants.LINE} />
              <Skeleton variant={SkeletonVariants.BLOCK} />
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
