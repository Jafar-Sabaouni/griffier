import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";

import {
  ApiError,
  checkMarkedPassages,
  renameSpeakers,
} from "../api/interviews";
import {
  Badge,
  BadgeVariants,
  Button,
  ButtonSizes,
  ButtonVariants,
  ContextMenu,
} from "../components/ui";
import type { ContextMenuPosition } from "../components/ui";
import { ProcessingSkeleton } from "../features/capture/ProcessingSkeleton";
import { RenameSpeakerModal } from "../features/transcript/RenameSpeakerModal";
import { SpeakersSidebar } from "../features/transcript/SpeakersSidebar";
import { TranscriptPane } from "../features/transcript/TranscriptPane";
import type {
  PendingMark,
  SegmentSelection,
} from "../features/transcript/highlights";
import { deriveSpeakerSummaries } from "../features/transcript/speakers";
import {
  ResourceStatuses,
  useInterviewResource,
} from "../hooks/useInterviewResource";
import type { Interview } from "../types/interview";

interface WorkspaceLocationState {
  readonly interview?: Interview;
  readonly localAudioFile?: File;
}

interface SpeakerMenuState {
  readonly speaker: string;
  readonly position: ContextMenuPosition;
}

export function InterviewWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const navState = (location.state as WorkspaceLocationState | null) ?? null;

  const resource = useInterviewResource(
    id,
    navState?.interview ?? null,
    navState?.localAudioFile ?? null,
  );

  const [updatedInterview, setUpdatedInterview] = useState<Interview | null>(
    null,
  );
  const [speakerMenu, setSpeakerMenu] = useState<SpeakerMenuState | null>(null);
  const [renamingSpeaker, setRenamingSpeaker] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [pendingMarks, setPendingMarks] = useState<readonly PendingMark[]>([]);
  const [checkingInterviewId, setCheckingInterviewId] = useState<string | null>(
    null,
  );
  const [checkMarksError, setCheckMarksError] = useState<{
    readonly interviewId: string;
    readonly message: string;
  } | null>(null);

  const interview =
    updatedInterview && updatedInterview.id === id
      ? updatedInterview
      : resource.interview;

  const activePendingMarks = interview
    ? pendingMarks.filter((mark) => mark.interviewId === interview.id)
    : [];
  const isCheckingMarks =
    interview !== null && checkingInterviewId === interview.id;
  const activeCheckMarksError =
    interview !== null && checkMarksError?.interviewId === interview.id
      ? checkMarksError.message
      : null;

  const handleOpenSpeakerMenu = (
    speaker: string,
    position: ContextMenuPosition,
  ) => {
    setSpeakerMenu({ speaker, position });
  };

  const handleAddPendingMark = (selection: SegmentSelection) => {
    if (!interview) {
      return;
    }
    setCheckMarksError((prev) =>
      prev?.interviewId === interview.id ? null : prev,
    );
    setPendingMarks((prev) => {
      const exists = prev.some(
        (item) =>
          item.interviewId === interview.id &&
          item.segmentId === selection.segmentId &&
          item.startOffset === selection.startOffset &&
          item.endOffset === selection.endOffset,
      );
      if (exists) {
        return prev;
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          interviewId: interview.id,
          segmentId: selection.segmentId,
          quote: selection.quote,
          startOffset: selection.startOffset,
          endOffset: selection.endOffset,
        },
      ];
    });
  };

  const handleRemovePendingMark = (markId: string) => {
    if (interview) {
      setCheckMarksError((prev) =>
        prev?.interviewId === interview.id ? null : prev,
      );
    }
    setPendingMarks((prev) => prev.filter((item) => item.id !== markId));
  };

  const handleCheckPendingMarks = async () => {
    if (!interview || activePendingMarks.length === 0 || isCheckingMarks) {
      return;
    }
    const targetInterview = interview;
    const targetInterviewId = interview.id;
    setCheckMarksError((prev) =>
      prev?.interviewId === targetInterviewId ? null : prev,
    );
    setCheckingInterviewId(targetInterviewId);
    const submittedIds = new Set(activePendingMarks.map((mark) => mark.id));
    try {
      const response = await checkMarkedPassages(
        targetInterviewId,
        activePendingMarks.map((mark) => ({
          segment_id: mark.segmentId,
          quote: mark.quote,
          start_offset: mark.startOffset,
          end_offset: mark.endOffset,
        })),
      );
      setUpdatedInterview((prev) => {
        const base =
          prev && prev.id === targetInterviewId ? prev : targetInterview;
        const existingClaimIds = new Set(base.claims.map((claim) => claim.id));
        const newClaims = response.claims.filter(
          (claim) => !existingClaimIds.has(claim.id),
        );
        return {
          ...base,
          claims: [...base.claims, ...newClaims],
          warnings: [...base.warnings, ...response.warnings],
        };
      });
      setPendingMarks((prev) =>
        prev.filter((item) => !submittedIds.has(item.id)),
      );
    } catch (err: unknown) {
      setCheckMarksError({
        interviewId: targetInterviewId,
        message:
          err instanceof ApiError
            ? err.message
            : "Failed to fact-check marked passages.",
      });
    } finally {
      setCheckingInterviewId((prev) =>
        prev === targetInterviewId ? null : prev,
      );
    }
  };

  const handleRenameSpeaker = async (oldName: string, newName: string) => {
    if (!interview) {
      return;
    }
    setRenameError(null);
    setIsRenaming(true);
    try {
      const next = await renameSpeakers(interview.id, { [oldName]: newName });
      setUpdatedInterview(next);
      setRenamingSpeaker(null);
    } catch (err: unknown) {
      setRenameError(
        err instanceof ApiError ? err.message : "Failed to rename speaker.",
      );
    } finally {
      setIsRenaming(false);
    }
  };

  if (resource.status === ResourceStatuses.LOADING) {
    return <ProcessingSkeleton label="Loading interview..." />;
  }

  if (resource.status === ResourceStatuses.ERROR || !interview) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-surface-canvas px-6">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-semibold text-text-primary">
            Interview not found
          </h1>
          <p className="text-sm text-text-secondary">
            {resource.error ?? "This interview could not be loaded."}
          </p>
          <Button
            variant={ButtonVariants.PRIMARY}
            size={ButtonSizes.MD}
            onClick={() => {
              void navigate("/");
            }}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Griffier
          </Button>
        </div>
      </main>
    );
  }

  const speakers = deriveSpeakerSummaries(interview.segments);

  return (
    <div className="flex min-h-screen flex-col gap-3 bg-surface-canvas p-4 lg:h-screen lg:overflow-hidden">
      <header className="flex items-center justify-between gap-4 px-1">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight text-text-primary transition-colors hover:text-text-secondary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Griffier</span>
          </Link>
          <span className="text-text-muted" aria-hidden="true">
            /
          </span>
          <h1 className="truncate text-sm font-medium text-text-secondary">
            {interview.title}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={BadgeVariants.NEUTRAL}>
            {interview.segments.length} segments
          </Badge>
          <Badge variant={BadgeVariants.NEUTRAL}>
            {interview.claims.length} claims
          </Badge>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <SpeakersSidebar
          speakers={speakers}
          onEditSpeaker={(speaker) => {
            setRenameError(null);
            setRenamingSpeaker(speaker);
          }}
        />

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
          <TranscriptPane
            key={interview.id}
            interview={interview}
            audioUrl={resource.audioUrl}
            audioLoading={resource.audioLoading}
            audioUnavailable={resource.audioUnavailable}
            pendingMarks={activePendingMarks}
            isCheckingMarks={isCheckingMarks}
            checkMarksError={activeCheckMarksError}
            onSpeakerContextMenu={handleOpenSpeakerMenu}
            onAddPendingMark={handleAddPendingMark}
            onRemovePendingMark={handleRemovePendingMark}
            onCheckPendingMarks={() => {
              void handleCheckPendingMarks();
            }}
          />

          <section
            aria-label="Intelligence"
            className="flex min-h-0 flex-col gap-4 overflow-y-auto rounded-2xl bg-surface-subtle p-4"
          >
            <header className="flex h-7 items-center justify-between gap-3 border-b border-border-subtle pb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Intelligence
              </h2>
            </header>
            {interview.summary && (
              <p className="text-sm leading-relaxed text-text-primary">
                {interview.summary}
              </p>
            )}
            <p className="text-xs text-text-secondary">
              {interview.sources.length} external sources ·{" "}
              {interview.claims.length} claims ready for review.
            </p>
          </section>
        </div>
      </main>

      <ContextMenu
        open={speakerMenu !== null}
        position={speakerMenu?.position ?? { x: 0, y: 0 }}
        ariaLabel="Speaker actions"
        onClose={() => setSpeakerMenu(null)}
        items={
          speakerMenu
            ? [
                {
                  id: "rename-speaker",
                  label: `Rename "${speakerMenu.speaker}"`,
                  onSelect: () => {
                    setRenameError(null);
                    setRenamingSpeaker(speakerMenu.speaker);
                  },
                },
              ]
            : []
        }
      />

      <RenameSpeakerModal
        speaker={renamingSpeaker}
        existingSpeakers={speakers.map((item) => item.name)}
        isSaving={isRenaming}
        error={renameError}
        onClose={() => {
          setRenameError(null);
          setRenamingSpeaker(null);
        }}
        onConfirm={handleRenameSpeaker}
      />
    </div>
  );
}
