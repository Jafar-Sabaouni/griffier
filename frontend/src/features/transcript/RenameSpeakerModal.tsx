import { useId, useState } from "react";
import type { FormEvent } from "react";

import {
  Button,
  ButtonSizes,
  ButtonVariants,
  Input,
  InputSizes,
  Modal,
} from "../../components/ui";

interface RenameSpeakerFormProps {
  readonly speaker: string;
  readonly existingSpeakers: readonly string[];
  readonly isSaving: boolean;
  readonly error: string | null;
  readonly onClose: () => void;
  readonly onConfirm: (oldName: string, newName: string) => Promise<void>;
}

function RenameSpeakerFormContent({
  speaker,
  existingSpeakers,
  isSaving,
  error,
  onClose,
  onConfirm,
}: RenameSpeakerFormProps) {
  const [draftName, setDraftName] = useState(speaker);
  const [pendingMergeTarget, setPendingMergeTarget] = useState<string | null>(
    null,
  );
  const formId = useId();
  const inputId = useId();

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) {
      return;
    }
    const trimmed = draftName.trim();
    if (!trimmed) {
      return;
    }
    if (trimmed === speaker) {
      onClose();
      return;
    }
    if (existingSpeakers.includes(trimmed)) {
      setPendingMergeTarget(trimmed);
      return;
    }
    void onConfirm(speaker, trimmed);
  };

  if (pendingMergeTarget) {
    return (
      <Modal
        open
        title="Merge speakers?"
        subtitle={`"${pendingMergeTarget}" already exists in this interview.`}
        onClose={handleClose}
        body={
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed text-text-secondary">
              Renaming{" "}
              <span className="font-medium text-text-primary">{speaker}</span>{" "}
              to{" "}
              <span className="font-medium text-text-primary">
                {pendingMergeTarget}
              </span>{" "}
              will combine all of their transcript segments and claims into a
              single speaker.
            </p>
            {error && (
              <p
                role="alert"
                className="rounded-md bg-status-danger-bg px-3 py-2 text-xs text-status-danger"
              >
                {error}
              </p>
            )}
          </div>
        }
        footer={
          <>
            <Button
              variant={ButtonVariants.SECONDARY}
              size={ButtonSizes.SM}
              onClick={() => setPendingMergeTarget(null)}
              disabled={isSaving}
            >
              Back
            </Button>
            <Button
              variant={ButtonVariants.PRIMARY}
              size={ButtonSizes.SM}
              onClick={() => {
                void onConfirm(speaker, pendingMergeTarget);
              }}
              disabled={isSaving}
            >
              {isSaving ? "Merging..." : "Merge speakers"}
            </Button>
          </>
        }
      />
    );
  }

  return (
    <Modal
      open
      title="Rename speaker"
      subtitle={`Updates all transcript segments and claims attributed to "${speaker}".`}
      onClose={handleClose}
      body={
        <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={inputId}
              className="text-xs font-medium text-text-secondary"
            >
              Speaker name
            </label>
            <Input
              id={inputId}
              size={InputSizes.MD}
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              disabled={isSaving}
              invalid={Boolean(error)}
              autoFocus
            />
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-md bg-status-danger-bg px-3 py-2 text-xs text-status-danger"
            >
              {error}
            </p>
          )}
        </form>
      }
      footer={
        <>
          <Button
            variant={ButtonVariants.SECONDARY}
            size={ButtonSizes.SM}
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            variant={ButtonVariants.PRIMARY}
            size={ButtonSizes.SM}
            disabled={isSaving || draftName.trim().length === 0}
          >
            {isSaving ? "Saving..." : "Save name"}
          </Button>
        </>
      }
    />
  );
}

export interface RenameSpeakerModalProps {
  readonly speaker: string | null;
  readonly existingSpeakers: readonly string[];
  readonly isSaving: boolean;
  readonly error: string | null;
  readonly onClose: () => void;
  readonly onConfirm: (oldName: string, newName: string) => Promise<void>;
}

export function RenameSpeakerModal({
  speaker,
  existingSpeakers,
  isSaving,
  error,
  onClose,
  onConfirm,
}: RenameSpeakerModalProps) {
  if (!speaker) {
    return null;
  }

  return (
    <RenameSpeakerFormContent
      key={speaker}
      speaker={speaker}
      existingSpeakers={existingSpeakers}
      isSaving={isSaving}
      error={error}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
