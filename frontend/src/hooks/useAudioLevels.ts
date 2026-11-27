import { useMemo, useSyncExternalStore } from "react";

const DEFAULT_BAR_COUNT = 12;
const DEFAULT_SAMPLE_INTERVAL_MS = 70;
const ANALYSER_FFT_SIZE = 256;
const VOICE_GAIN = 3.2;

type Listener = () => void;

interface AudioLevelsStore {
  readonly subscribe: (listener: Listener) => () => void;
  readonly getSnapshot: () => readonly number[];
}

interface WebkitGlobal {
  readonly AudioContext?: typeof AudioContext;
  readonly webkitAudioContext?: typeof AudioContext;
}

function getAudioContextConstructor(): typeof AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }
  const host = globalThis as unknown as WebkitGlobal;
  return host.AudioContext ?? host.webkitAudioContext ?? null;
}

function createZeroLevels(barCount: number): readonly number[] {
  return Array.from({ length: barCount }, () => 0);
}

function computeNormalizedRms(samples: Uint8Array<ArrayBuffer>): number {
  let sumSquares = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const byte = samples[i] ?? 128;
    const normalized = (byte - 128) / 128;
    sumSquares += normalized * normalized;
  }
  const rms = Math.sqrt(sumSquares / samples.length);
  return Math.min(1, rms * VOICE_GAIN);
}

function createAudioLevelsStore(
  stream: MediaStream | null,
  barCount: number,
  sampleIntervalMs: number,
): AudioLevelsStore {
  const idleSnapshot = createZeroLevels(barCount);
  let currentSnapshot: readonly number[] = idleSnapshot;

  return {
    getSnapshot: () => currentSnapshot,
    subscribe: (listener: Listener) => {
      if (!stream) {
        currentSnapshot = idleSnapshot;
        return () => {};
      }

      const AudioCtx = getAudioContextConstructor();
      if (!AudioCtx) {
        return () => {};
      }

      const audioCtx = new AudioCtx();
      if (audioCtx.state === "suspended") {
        void audioCtx.resume().catch(() => {});
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = ANALYSER_FFT_SIZE;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);

      const sampleBuffer = new Uint8Array(new ArrayBuffer(analyser.fftSize));
      let rafId: number | null = null;
      let lastSampleTime = 0;
      let disposed = false;

      const tick = (timestamp: number) => {
        if (disposed) {
          return;
        }

        if (timestamp - lastSampleTime >= sampleIntervalMs) {
          lastSampleTime = timestamp;
          analyser.getByteTimeDomainData(sampleBuffer);
          const rms = computeNormalizedRms(sampleBuffer);
          currentSnapshot = [...currentSnapshot.slice(1), rms];
          listener();
        }

        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);

      return () => {
        disposed = true;
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        source.disconnect();
        analyser.disconnect();
        if (audioCtx.state !== "closed") {
          void audioCtx.close().catch(() => {});
        }
        currentSnapshot = idleSnapshot;
      };
    },
  };
}

export interface UseAudioLevelsOptions {
  readonly barCount?: number;
  readonly sampleIntervalMs?: number;
}

export function useAudioLevels(
  stream: MediaStream | null,
  options?: UseAudioLevelsOptions,
): readonly number[] {
  const barCount = options?.barCount ?? DEFAULT_BAR_COUNT;
  const sampleIntervalMs =
    options?.sampleIntervalMs ?? DEFAULT_SAMPLE_INTERVAL_MS;

  const store = useMemo(
    () => createAudioLevelsStore(stream, barCount, sampleIntervalMs),
    [stream, barCount, sampleIntervalMs],
  );

  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
}
