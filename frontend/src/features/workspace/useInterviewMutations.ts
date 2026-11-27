import { useState } from "react";

import {
  ApiError,
  checkMarkedPassages,
  deleteClaim,
  renameSpeakers,
} from "../../api/interviews";
import type { PendingMark, SegmentSelection } from "../transcript/highlights";
import type { Interview } from "../../types/interview";

interface ScopedError {
  readonly interviewId: string;
  readonly message: string;
}

export interface InterviewMutationsResult {
  readonly interview: Interview | null;
  readonly pendingMarks: readonly PendingMark[];
  readonly isCheckingMarks: boolean;
  readonly checkMarksError: string | null;
  readonly dismissingClaimIds: ReadonlySet<string>;
  readonly dismissError: string | null;
  readonly isRenaming: boolean;
  readonly renameError: string | null;
  readonly clearRenameError: () => void;
  readonly addPendingMark: (selection: SegmentSelection) => void;
  readonly removePendingMark: (markId: string) => void;
  readonly checkPendingMarks: () => Promise<void>;
  readonly dismissClaim: (claimId: string) => Promise<boolean>;
  readonly renameSpeaker: (
    oldName: string,
    newName: string,
  ) => Promise<boolean>;
}

export function useInterviewMutations(
  interviewId: string | undefined,
  resourceInterview: Interview | null,
): InterviewMutationsResult {
  const [updatedInterview, setUpdatedInterview] = useState<Interview | null>(
    null,
  );
  const [pendingMarks, setPendingMarks] = useState<readonly PendingMark[]>([]);
  const [checkingInterviewId, setCheckingInterviewId] = useState<string | null>(
    null,
  );
  const [checkMarksError, setCheckMarksError] = useState<ScopedError | null>(
    null,
  );
  const [dismissingClaimIds, setDismissingClaimIds] = useState<
    ReadonlySet<string>
  >(() => new Set());
  const [dismissError, setDismissError] = useState<ScopedError | null>(null);
  const [renamingInterviewId, setRenamingInterviewId] = useState<string | null>(
    null,
  );
  const [renameError, setRenameError] = useState<ScopedError | null>(null);

  const interview =
    updatedInterview && updatedInterview.id === interviewId
      ? updatedInterview
      : resourceInterview;

  const activePendingMarks = interview
    ? pendingMarks.filter((mark) => mark.interviewId === interview.id)
    : [];
  const isCheckingMarks =
    interview !== null && checkingInterviewId === interview.id;
  const activeCheckMarksError =
    interview !== null && checkMarksError?.interviewId === interview.id
      ? checkMarksError.message
      : null;
  const activeDismissError =
    interview !== null && dismissError?.interviewId === interview.id
      ? dismissError.message
      : null;
  const isRenaming = interview !== null && renamingInterviewId === interview.id;
  const activeRenameError =
    interview !== null && renameError?.interviewId === interview.id
      ? renameError.message
      : null;

  const clearRenameError = () => {
    if (!interview) {
      return;
    }
    setRenameError((prev) =>
      prev?.interviewId === interview.id ? null : prev,
    );
  };

  const addPendingMark = (selection: SegmentSelection) => {
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

  const removePendingMark = (markId: string) => {
    if (interview) {
      setCheckMarksError((prev) =>
        prev?.interviewId === interview.id ? null : prev,
      );
    }
    setPendingMarks((prev) => prev.filter((item) => item.id !== markId));
  };

  const checkPendingMarks = async () => {
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

  const dismissClaim = async (claimId: string): Promise<boolean> => {
    if (!interview || dismissingClaimIds.has(claimId)) {
      return false;
    }
    const targetInterview = interview;
    const targetInterviewId = interview.id;
    setDismissError((prev) =>
      prev?.interviewId === targetInterviewId ? null : prev,
    );
    setDismissingClaimIds((prev) => {
      const next = new Set(prev);
      next.add(claimId);
      return next;
    });
    try {
      await deleteClaim(targetInterviewId, claimId);
      setUpdatedInterview((prev) => {
        const base =
          prev && prev.id === targetInterviewId ? prev : targetInterview;
        return {
          ...base,
          claims: base.claims.filter((claim) => claim.id !== claimId),
        };
      });
      return true;
    } catch (err: unknown) {
      setDismissError({
        interviewId: targetInterviewId,
        message:
          err instanceof ApiError ? err.message : "Failed to dismiss claim.",
      });
      return false;
    } finally {
      setDismissingClaimIds((prev) => {
        if (!prev.has(claimId)) {
          return prev;
        }
        const next = new Set(prev);
        next.delete(claimId);
        return next;
      });
    }
  };

  const renameSpeaker = async (
    oldName: string,
    newName: string,
  ): Promise<boolean> => {
    if (!interview || isRenaming) {
      return false;
    }
    const targetInterviewId = interview.id;
    setRenameError((prev) =>
      prev?.interviewId === targetInterviewId ? null : prev,
    );
    setRenamingInterviewId(targetInterviewId);
    try {
      const next = await renameSpeakers(targetInterviewId, {
        [oldName]: newName,
      });
      setUpdatedInterview(next);
      return true;
    } catch (err: unknown) {
      setRenameError({
        interviewId: targetInterviewId,
        message:
          err instanceof ApiError ? err.message : "Failed to rename speaker.",
      });
      return false;
    } finally {
      setRenamingInterviewId((prev) =>
        prev === targetInterviewId ? null : prev,
      );
    }
  };

  return {
    interview,
    pendingMarks: activePendingMarks,
    isCheckingMarks,
    checkMarksError: activeCheckMarksError,
    dismissingClaimIds,
    dismissError: activeDismissError,
    isRenaming,
    renameError: activeRenameError,
    clearRenameError,
    addPendingMark,
    removePendingMark,
    checkPendingMarks,
    dismissClaim,
    renameSpeaker,
  };
}
