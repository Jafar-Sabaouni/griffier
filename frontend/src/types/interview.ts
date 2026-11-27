export const ClaimOrigins = {
  AI: "ai",
  JOURNALIST: "journalist",
} as const;

export type ClaimOrigin = (typeof ClaimOrigins)[keyof typeof ClaimOrigins];

export const isClaimOrigin = (value: string): value is ClaimOrigin =>
  Object.values(ClaimOrigins).includes(value as ClaimOrigin);

export const ClaimVerdicts = {
  SUPPORTED: "supported",
  CONTRADICTED: "contradicted",
  NEEDS_CONTEXT: "needs_context",
  UNVERIFIED: "unverified",
} as const;

export type ClaimVerdict = (typeof ClaimVerdicts)[keyof typeof ClaimVerdicts];

export const isClaimVerdict = (value: string): value is ClaimVerdict =>
  Object.values(ClaimVerdicts).includes(value as ClaimVerdict);

export interface ExternalSource {
  readonly title: string;
  readonly url: string;
  readonly snippet: string;
  readonly published_date: string | null;
}

export interface TranscriptSegment {
  readonly id: string;
  readonly speaker: string;
  readonly start_ms: number;
  readonly end_ms: number;
  readonly text: string;
}

export interface Claim {
  readonly id: string;
  readonly origin: ClaimOrigin;
  readonly verdict: ClaimVerdict;
  readonly segment_id: string;
  readonly speaker: string;
  readonly quote: string;
  readonly start_offset: number | null;
  readonly end_offset: number | null;
  readonly explanation: string;
  readonly sources: readonly ExternalSource[];
}

export interface Interview {
  readonly id: string;
  readonly title: string;
  readonly created_at: string;
  readonly summary: string;
  readonly segments: readonly TranscriptSegment[];
  readonly claims: readonly Claim[];
  readonly sources: readonly ExternalSource[];
  readonly warnings: readonly string[];
}

export interface MarkedPassagePayload {
  readonly segment_id: string;
  readonly quote: string;
  readonly start_offset?: number | null;
  readonly end_offset?: number | null;
}

export interface CheckMarkedPassagesResponse {
  readonly claims: readonly Claim[];
  readonly warnings: readonly string[];
}

export interface RenameSpeakersPayload {
  readonly speaker_map: Readonly<Record<string, string>>;
}

export interface ApiErrorPayload {
  readonly error?: string;
  readonly detail?: string;
}
