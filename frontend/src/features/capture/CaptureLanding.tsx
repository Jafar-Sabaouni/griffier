import { Mic, Square, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router";

import { ApiError, createInterview } from "../../api/interviews";
import {
  AudioWaveform,
  AudioWaveformSizes,
  Button,
  ButtonShapes,
  ButtonSizes,
  ButtonVariants,
  DragDropWrapper,
} from "../../components/ui";
import { useAudioLevels } from "../../hooks/useAudioLevels";
import {
  RecorderStatuses,
  useAudioRecorder,
} from "../../hooks/useAudioRecorder";
import { ProcessingSkeleton } from "./ProcessingSkeleton";

const ACCEPTED_AUDIO_TYPES =
  "audio/mpeg,audio/wav,audio/webm,audio/mp4,audio/m4a,audio/ogg,.mp3,.wav,.webm,.m4a,.mp4,.ogg";

const WAVEFORM_BAR_COUNT = 16;

function formatElapsedTime(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function CaptureLanding() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    status,
    elapsedMs,
    stream,
    error: recorderError,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  const liveLevels = useAudioLevels(stream, { barCount: WAVEFORM_BAR_COUNT });
  const isRecording = status === RecorderStatuses.RECORDING;
  const activeError = submitError ?? recorderError;

  const submitAudioFile = async (file: File) => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const interview = await createInterview(file);
      const localAudioUrl = URL.createObjectURL(file);
      void navigate(`/interviews/${interview.id}`, {
        state: { interview, localAudioUrl },
      });
    } catch (err: unknown) {
      setIsSubmitting(false);
      if (err instanceof ApiError) {
        setSubmitError(err.message);
        return;
      }
      setSubmitError("Failed to process audio. Please try again.");
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    void submitAudioFile(file);
  };

  const handleStopAndSubmit = async () => {
    const recordedFile = await stopRecording();
    if (!recordedFile) {
      setSubmitError("No audio was captured. Try recording again.");
      return;
    }
    await submitAudioFile(recordedFile);
  };

  if (isSubmitting) {
    return <ProcessingSkeleton />;
  }

  return (
    <DragDropWrapper
      onFileDrop={(file) => {
        void submitAudioFile(file);
      }}
      disabled={isRecording || isSubmitting}
      title="Drop audio file to transcribe"
      subtitle="MP3, WAV, WebM, M4A, or OGG up to 25 MB"
    >
      <main className="flex min-h-screen flex-col items-center justify-center bg-surface-canvas px-6">
        <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-4xl font-semibold tracking-tight text-text-primary">
              Griffier
            </h1>
            <p className="text-sm text-text-secondary">
              Record or upload an interview for speaker-attributed transcripts
              and source-grounded fact-checks.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_AUDIO_TYPES}
            onChange={handleFileChange}
            className="sr-only"
            aria-label="Upload audio file"
          />

          {!isRecording ? (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant={ButtonVariants.PRIMARY}
                size={ButtonSizes.LG}
                shape={ButtonShapes.PILL}
                onClick={() => {
                  setSubmitError(null);
                  void startRecording();
                }}
              >
                <Mic className="h-4 w-4" aria-hidden="true" />
                Start recording
              </Button>
              <Button
                variant={ButtonVariants.SECONDARY}
                size={ButtonSizes.LG}
                shape={ButtonShapes.ICON}
                aria-label="Upload audio"
                title="Upload audio"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5">
              <div className="flex items-center gap-4">
                <AudioWaveform
                  levels={liveLevels}
                  barCount={WAVEFORM_BAR_COUNT}
                  size={AudioWaveformSizes.MD}
                  active
                  label="Live microphone level"
                />
                <span
                  className="font-mono text-sm font-medium text-text-primary tabular-nums"
                  aria-live="off"
                >
                  {formatElapsedTime(elapsedMs)}
                </span>
              </div>

              <div className="flex items-center justify-center gap-3">
                <Button
                  variant={ButtonVariants.PRIMARY}
                  size={ButtonSizes.LG}
                  shape={ButtonShapes.PILL}
                  onClick={() => {
                    void handleStopAndSubmit();
                  }}
                >
                  <Square
                    className="h-3.5 w-3.5 fill-current"
                    aria-hidden="true"
                  />
                  Stop recording
                </Button>
                <Button
                  variant={ButtonVariants.SECONDARY}
                  size={ButtonSizes.LG}
                  shape={ButtonShapes.ICON}
                  aria-label="Cancel recording"
                  title="Cancel recording"
                  onClick={cancelRecording}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}

          {activeError && (
            <p
              role="alert"
              className="w-full rounded-md bg-status-danger-bg px-4 py-2.5 text-xs text-status-danger"
            >
              {activeError}
            </p>
          )}
        </div>
      </main>
    </DragDropWrapper>
  );
}
