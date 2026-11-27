import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";

import { ContextMenu } from "../components/ui";
import type { ContextMenuPosition } from "../components/ui";
import { ProcessingSkeleton } from "../features/capture/ProcessingSkeleton";
import { IntelligencePane } from "../features/intelligence/IntelligencePane";
import { RenameSpeakerModal } from "../features/transcript/RenameSpeakerModal";
import { SpeakersSidebar } from "../features/transcript/SpeakersSidebar";
import { TranscriptPane } from "../features/transcript/TranscriptPane";
import { deriveSpeakerSummaries } from "../features/transcript/speakers";
import { WorkspaceHeader } from "../features/workspace/WorkspaceHeader";
import { WorkspaceNotFound } from "../features/workspace/WorkspaceNotFound";
import { useInterviewMutations } from "../features/workspace/useInterviewMutations";
import {
  ResourceStatuses,
  useInterviewResource,
} from "../hooks/useInterviewResource";
import type { Claim, Interview } from "../types/interview";

const FocusSources = {
  TRANSCRIPT: "transcript",
  INTELLIGENCE: "intelligence",
} as const;

type FocusSource = (typeof FocusSources)[keyof typeof FocusSources];

interface FocusTarget {
  readonly interviewId: string;
  readonly claimId: string;
  readonly segmentId: string;
  readonly source: FocusSource;
  readonly seq: number;
}

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
  const mutations = useInterviewMutations(id, resource.interview);

  const [speakerMenu, setSpeakerMenu] = useState<SpeakerMenuState | null>(null);
  const [renamingSpeaker, setRenamingSpeaker] = useState<string | null>(null);
  const [focusedTarget, setFocusedTarget] = useState<FocusTarget | null>(null);

  const { interview } = mutations;

  const activeFocus =
    interview !== null && focusedTarget?.interviewId === interview.id
      ? focusedTarget
      : null;
  const transcriptFocusRequest =
    activeFocus && activeFocus.source === FocusSources.INTELLIGENCE
      ? { segmentId: activeFocus.segmentId, seq: activeFocus.seq }
      : null;
  const intelligenceScrollSeq =
    activeFocus && activeFocus.source === FocusSources.TRANSCRIPT
      ? activeFocus.seq
      : 0;

  const handleOpenSpeakerMenu = (
    speaker: string,
    position: ContextMenuPosition,
  ) => {
    setSpeakerMenu({ speaker, position });
  };

  const handleOpenRenameModal = (speaker: string) => {
    mutations.clearRenameError();
    setRenamingSpeaker(speaker);
  };

  const handleFocusClaimFromIntelligence = (claim: Claim) => {
    if (!interview) {
      return;
    }
    setFocusedTarget((prev) => ({
      interviewId: interview.id,
      claimId: claim.id,
      segmentId: claim.segment_id,
      source: FocusSources.INTELLIGENCE,
      seq: (prev?.seq ?? 0) + 1,
    }));
  };

  const handleFocusClaimFromTranscript = (
    claimId: string,
    segmentId: string,
  ) => {
    if (!interview) {
      return;
    }
    setFocusedTarget((prev) => ({
      interviewId: interview.id,
      claimId,
      segmentId,
      source: FocusSources.TRANSCRIPT,
      seq: (prev?.seq ?? 0) + 1,
    }));
  };

  const handleDismissClaim = async (claimId: string) => {
    const dismissed = await mutations.dismissClaim(claimId);
    if (dismissed) {
      setFocusedTarget((prev) => (prev?.claimId === claimId ? null : prev));
    }
  };

  const handleRenameSpeaker = async (oldName: string, newName: string) => {
    const renamed = await mutations.renameSpeaker(oldName, newName);
    if (renamed) {
      setRenamingSpeaker(null);
    }
  };

  if (resource.status === ResourceStatuses.LOADING) {
    return <ProcessingSkeleton label="Loading interview..." />;
  }

  if (resource.status === ResourceStatuses.ERROR || !interview) {
    return (
      <WorkspaceNotFound
        message={resource.error}
        onBack={() => {
          void navigate("/");
        }}
      />
    );
  }

  const speakers = deriveSpeakerSummaries(interview.segments);

  return (
    <div className="flex min-h-screen flex-col gap-3 bg-surface-canvas p-4 lg:h-screen lg:overflow-hidden">
      <WorkspaceHeader
        title={interview.title}
        segmentCount={interview.segments.length}
        claimCount={interview.claims.length}
      />

      <main className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <SpeakersSidebar
          speakers={speakers}
          onEditSpeaker={handleOpenRenameModal}
        />

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
          <TranscriptPane
            key={interview.id}
            interview={interview}
            audioUrl={resource.audioUrl}
            audioLoading={resource.audioLoading}
            audioUnavailable={resource.audioUnavailable}
            pendingMarks={mutations.pendingMarks}
            isCheckingMarks={mutations.isCheckingMarks}
            checkMarksError={mutations.checkMarksError}
            focusedClaimId={activeFocus?.claimId ?? null}
            focusRequest={transcriptFocusRequest}
            onSpeakerContextMenu={handleOpenSpeakerMenu}
            onClaimHighlightClick={handleFocusClaimFromTranscript}
            onAddPendingMark={mutations.addPendingMark}
            onRemovePendingMark={mutations.removePendingMark}
            onCheckPendingMarks={() => {
              void mutations.checkPendingMarks();
            }}
          />

          <IntelligencePane
            interview={interview}
            focusedClaimId={activeFocus?.claimId ?? null}
            scrollToFocusedSeq={intelligenceScrollSeq}
            dismissingClaimIds={mutations.dismissingClaimIds}
            dismissError={mutations.dismissError}
            onFocusClaim={handleFocusClaimFromIntelligence}
            onDismissClaim={(claimId) => {
              void handleDismissClaim(claimId);
            }}
          />
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
                  onSelect: () => handleOpenRenameModal(speakerMenu.speaker),
                },
              ]
            : []
        }
      />

      <RenameSpeakerModal
        speaker={renamingSpeaker}
        existingSpeakers={speakers.map((item) => item.name)}
        isSaving={mutations.isRenaming}
        error={mutations.renameError}
        onClose={() => {
          mutations.clearRenameError();
          setRenamingSpeaker(null);
        }}
        onConfirm={handleRenameSpeaker}
      />
    </div>
  );
}
