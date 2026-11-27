import { useMemo, useSyncExternalStore } from "react";

import {
  ApiError,
  getInterview,
  getInterviewAudioUrl,
} from "../api/interviews";
import type { Interview } from "../types/interview";

export const ResourceStatuses = {
  LOADING: "loading",
  READY: "ready",
  ERROR: "error",
} as const;

export type ResourceStatus =
  (typeof ResourceStatuses)[keyof typeof ResourceStatuses];

export interface InterviewResourceSnapshot {
  readonly status: ResourceStatus;
  readonly interview: Interview | null;
  readonly audioUrl: string | null;
  readonly audioLoading: boolean;
  readonly audioUnavailable: boolean;
  readonly error: string | null;
}

interface InterviewResourceStore {
  readonly subscribe: (listener: () => void) => () => void;
  readonly getSnapshot: () => InterviewResourceSnapshot;
}

function createInterviewResourceStore(
  interviewId: string | undefined,
  initialInterview: Interview | null,
  initialAudioFile: File | null,
): InterviewResourceStore {
  let snapshot: InterviewResourceSnapshot =
    initialInterview && initialInterview.id === interviewId
      ? {
          status: ResourceStatuses.READY,
          interview: initialInterview,
          audioUrl: null,
          audioLoading: true,
          audioUnavailable: false,
          error: null,
        }
      : {
          status: ResourceStatuses.LOADING,
          interview: null,
          audioUrl: null,
          audioLoading: true,
          audioUnavailable: false,
          error: null,
        };

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      if (!interviewId) {
        snapshot = {
          status: ResourceStatuses.ERROR,
          interview: null,
          audioUrl: null,
          audioLoading: false,
          audioUnavailable: true,
          error: "Missing interview ID.",
        };
        listener();
        return () => {};
      }

      const controller = new AbortController();
      let ownedBlobUrl: string | null = null;
      let disposed = false;

      const emit = (next: InterviewResourceSnapshot) => {
        if (disposed) {
          return;
        }
        snapshot = next;
        listener();
      };

      const attachAudio = async (id: string) => {
        if (initialAudioFile instanceof Blob) {
          ownedBlobUrl = URL.createObjectURL(initialAudioFile);
          emit({
            ...snapshot,
            audioUrl: ownedBlobUrl,
            audioLoading: false,
            audioUnavailable: false,
          });
          return;
        }

        try {
          const response = await fetch(getInterviewAudioUrl(id), {
            signal: controller.signal,
          });
          if (!response.ok) {
            emit({
              ...snapshot,
              audioUrl: null,
              audioLoading: false,
              audioUnavailable: true,
            });
            return;
          }
          const blob = await response.blob();
          if (disposed) {
            return;
          }
          ownedBlobUrl = URL.createObjectURL(blob);
          emit({
            ...snapshot,
            audioUrl: ownedBlobUrl,
            audioLoading: false,
            audioUnavailable: false,
          });
        } catch {
          if (!disposed) {
            emit({
              ...snapshot,
              audioUrl: null,
              audioLoading: false,
              audioUnavailable: true,
            });
          }
        }
      };

      const load = async () => {
        if (snapshot.interview && snapshot.interview.id === interviewId) {
          void attachAudio(interviewId);
          try {
            const fresh = await getInterview(interviewId, {
              signal: controller.signal,
            });
            emit({
              ...snapshot,
              status: ResourceStatuses.READY,
              interview: fresh,
            });
          } catch {
            // Keep navigation snapshot if background revalidation fails.
          }
          return;
        }

        try {
          const fetched = await getInterview(interviewId, {
            signal: controller.signal,
          });
          emit({
            status: ResourceStatuses.READY,
            interview: fetched,
            audioUrl: null,
            audioLoading: true,
            audioUnavailable: false,
            error: null,
          });
          await attachAudio(interviewId);
        } catch (err: unknown) {
          if (disposed) {
            return;
          }
          const message =
            err instanceof ApiError
              ? err.message
              : "Could not load interview.";
          emit({
            status: ResourceStatuses.ERROR,
            interview: null,
            audioUrl: null,
            audioLoading: false,
            audioUnavailable: true,
            error: message,
          });
        }
      };

      void load();

      return () => {
        disposed = true;
        controller.abort();
        if (ownedBlobUrl) {
          URL.revokeObjectURL(ownedBlobUrl);
          ownedBlobUrl = null;
        }
        snapshot = {
          ...snapshot,
          audioUrl: null,
          audioLoading: snapshot.status === ResourceStatuses.READY,
        };
      };
    },
  };
}

export function useInterviewResource(
  interviewId: string | undefined,
  initialInterview: Interview | null,
  initialAudioFile: File | null,
): InterviewResourceSnapshot {
  const store = useMemo(
    () =>
      createInterviewResourceStore(
        interviewId,
        initialInterview,
        initialAudioFile,
      ),
    [interviewId, initialInterview, initialAudioFile],
  );

  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
}
