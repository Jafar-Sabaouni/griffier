import { useEffect, useRef, useState } from "react";

export const RecorderStatuses = {
  IDLE: "idle",
  RECORDING: "recording",
  ERROR: "error",
} as const;

export type RecorderStatus =
  (typeof RecorderStatuses)[keyof typeof RecorderStatuses];

export const isRecorderStatus = (value: string): value is RecorderStatus =>
  Object.values(RecorderStatuses).includes(value as RecorderStatus);

const PREFERRED_MIME_TYPES: readonly string[] = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

const TIMER_INTERVAL_MS = 250;

function pickSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }
  for (const candidate of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }
  return "";
}

function extensionForMimeType(mimeType: string): string {
  const base = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  switch (base) {
    case "audio/mp4":
    case "audio/m4a":
      return "m4a";
    case "audio/ogg":
      return "ogg";
    case "audio/wav":
      return "wav";
    case "audio/mpeg":
      return "mp3";
    default:
      return "webm";
  }
}

function formatPermissionError(error: unknown): string {
  if (error instanceof DOMException) {
    if (
      error.name === "NotAllowedError" ||
      error.name === "PermissionDeniedError"
    ) {
      return "Microphone permission was denied. Allow access in your browser settings or upload an audio file.";
    }
    if (error.name === "NotFoundError") {
      return "No microphone was found. Connect a microphone or upload an audio file.";
    }
  }
  return "Could not access the microphone. Check your browser settings or upload an audio file.";
}

export interface UseAudioRecorderResult {
  readonly status: RecorderStatus;
  readonly elapsedMs: number;
  readonly stream: MediaStream | null;
  readonly error: string | null;
  readonly startRecording: () => Promise<void>;
  readonly stopRecording: () => Promise<File | null>;
  readonly cancelRecording: () => void;
}

export function useAudioRecorder(): UseAudioRecorderResult {
  const [status, setStatus] = useState<RecorderStatus>(RecorderStatuses.IDLE);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);
  const isUnmountedRef = useRef<boolean>(false);
  const isStartingRef = useRef<boolean>(false);
  const pendingStopRef = useRef<Promise<File | null> | null>(null);

  const releaseResources = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    recorderRef.current = null;
  };

  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
      pendingStopRef.current = null;
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.onstop = null;
        recorderRef.current.ondataavailable = null;
        recorderRef.current.stop();
      }
      releaseResources();
    };
  }, []);

  const startRecording = async () => {
    if (
      isStartingRef.current ||
      pendingStopRef.current !== null ||
      (recorderRef.current !== null && recorderRef.current.state !== "inactive")
    ) {
      return;
    }

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError(
        "Audio recording is not supported in this browser. Upload an audio file instead.",
      );
      setStatus(RecorderStatuses.ERROR);
      return;
    }

    isStartingRef.current = true;
    setError(null);
    chunksRef.current = [];

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      if (isUnmountedRef.current) {
        micStream.getTracks().forEach((track) => track.stop());
        return;
      }

      mediaStreamRef.current = micStream;

      const mimeType = pickSupportedMimeType();
      const recorder = mimeType
        ? new MediaRecorder(micStream, { mimeType })
        : new MediaRecorder(micStream);

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      setStream(micStream);
      setStatus(RecorderStatuses.RECORDING);

      recorder.start();
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startedAtRef.current);
      }, TIMER_INTERVAL_MS);
    } catch (err: unknown) {
      releaseResources();
      if (!isUnmountedRef.current) {
        setStream(null);
        setElapsedMs(0);
        setError(formatPermissionError(err));
        setStatus(RecorderStatuses.ERROR);
      }
    } finally {
      isStartingRef.current = false;
    }
  };

  const stopRecording = (): Promise<File | null> => {
    if (pendingStopRef.current !== null) {
      return pendingStopRef.current;
    }

    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      releaseResources();
      setStream(null);
      setStatus(RecorderStatuses.IDLE);
      return Promise.resolve(null);
    }

    const stopPromise = new Promise<File | null>((resolve) => {
      const resolvedMime = recorder.mimeType || "audio/webm";

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: resolvedMime });
        chunksRef.current = [];
        releaseResources();
        pendingStopRef.current = null;

        if (!isUnmountedRef.current) {
          setStream(null);
          setElapsedMs(0);
          setStatus(RecorderStatuses.IDLE);
        }

        if (blob.size === 0) {
          resolve(null);
          return;
        }

        const extension = extensionForMimeType(resolvedMime);
        const filename = `recording-${Date.now()}.${extension}`;
        resolve(new File([blob], filename, { type: resolvedMime }));
      };

      recorder.stop();
    });

    pendingStopRef.current = stopPromise;
    return stopPromise;
  };

  const cancelRecording = () => {
    pendingStopRef.current = null;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.ondataavailable = null;
      recorder.stop();
    }
    chunksRef.current = [];
    releaseResources();
    setStream(null);
    setElapsedMs(0);
    setError(null);
    setStatus(RecorderStatuses.IDLE);
  };

  return {
    status,
    elapsedMs,
    stream,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
