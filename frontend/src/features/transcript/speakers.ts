import type { TranscriptSegment } from "../../types/interview";

export interface SpeakerSummary {
  readonly name: string;
  readonly segmentCount: number;
}

export function deriveSpeakerSummaries(
  segments: readonly TranscriptSegment[],
): readonly SpeakerSummary[] {
  const counts = new Map<string, number>();
  for (const segment of segments) {
    counts.set(segment.speaker, (counts.get(segment.speaker) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([name, segmentCount]) => ({
    name,
    segmentCount,
  }));
}
