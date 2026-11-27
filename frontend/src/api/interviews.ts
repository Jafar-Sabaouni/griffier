import type {
  ApiErrorPayload,
  CheckMarkedPassagesResponse,
  Interview,
  MarkedPassagePayload,
  RenameSpeakersPayload,
} from "../types/interview";

export const API_TIMEOUT_MS = 120_000;
const INTERVIEWS_BASE_PATH = "/api/interviews";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly isTimeout: boolean;

  constructor(
    message: string,
    options: { status: number; code: string; isTimeout?: boolean },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.isTimeout = options.isTimeout ?? false;
  }
}

async function parseErrorPayload(response: Response): Promise<ApiErrorPayload | null> {
  try {
    const parsed: unknown = await response.json();
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    return {
      error: typeof record.error === "string" ? record.error : undefined,
      detail: typeof record.detail === "string" ? record.detail : undefined,
    };
  } catch {
    return null;
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = API_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const externalSignal = init.signal;
  const handleExternalAbort = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", handleExternalAbort, {
        once: true,
      });
    }
  }

  let didTimeout = false;
  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      if (didTimeout) {
        throw new ApiError("Request timed out while waiting for the server.", {
          status: 408,
          code: "request_timeout",
          isTimeout: true,
        });
      }
      throw error;
    }
    const message = error instanceof Error ? error.message : "Network request failed.";
    throw new ApiError(message, {
      status: 0,
      code: "network_error",
    });
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", handleExternalAbort);
  }
}

async function requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetchWithTimeout(url, init);
  if (!response.ok) {
    const payload = await parseErrorPayload(response);
    throw new ApiError(
      payload?.detail ?? `Request failed with status ${response.status}.`,
      {
        status: response.status,
        code: payload?.error ?? "http_error",
      },
    );
  }
  return (await response.json()) as T;
}

export function listInterviews(): Promise<Interview[]> {
  return requestJson<Interview[]>(INTERVIEWS_BASE_PATH, { method: "GET" });
}

export function createInterview(
  file: File | Blob,
  options?: { readonly filename?: string; readonly title?: string },
): Promise<Interview> {
  const formData = new FormData();
  const resolvedName =
    options?.filename ?? (file instanceof File ? file.name : "recording.webm");
  formData.append("file", file, resolvedName);
  if (options?.title?.trim()) {
    formData.append("title", options.title.trim());
  }

  return requestJson<Interview>(INTERVIEWS_BASE_PATH, {
    method: "POST",
    body: formData,
  });
}

export function getInterview(
  interviewId: string,
  options?: { readonly signal?: AbortSignal },
): Promise<Interview> {
  return requestJson<Interview>(
    `${INTERVIEWS_BASE_PATH}/${encodeURIComponent(interviewId)}`,
    { method: "GET", signal: options?.signal },
  );
}

export function getInterviewAudioUrl(interviewId: string): string {
  return `${INTERVIEWS_BASE_PATH}/${encodeURIComponent(interviewId)}/audio`;
}

export function renameSpeakers(
  interviewId: string,
  speakerMap: Readonly<Record<string, string>>,
): Promise<Interview> {
  const payload: RenameSpeakersPayload = { speaker_map: speakerMap };
  return requestJson<Interview>(
    `${INTERVIEWS_BASE_PATH}/${encodeURIComponent(interviewId)}/speakers`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

export function checkMarkedPassages(
  interviewId: string,
  passages: readonly MarkedPassagePayload[],
): Promise<CheckMarkedPassagesResponse> {
  return requestJson<CheckMarkedPassagesResponse>(
    `${INTERVIEWS_BASE_PATH}/${encodeURIComponent(interviewId)}/claims/check`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passages }),
    },
  );
}

export async function deleteClaim(
  interviewId: string,
  claimId: string,
): Promise<void> {
  const response = await fetchWithTimeout(
    `${INTERVIEWS_BASE_PATH}/${encodeURIComponent(interviewId)}/claims/${encodeURIComponent(claimId)}`,
    { method: "DELETE" },
  );
  if (!response.ok) {
    const payload = await parseErrorPayload(response);
    throw new ApiError(
      payload?.detail ?? `Request failed with status ${response.status}.`,
      {
        status: response.status,
        code: payload?.error ?? "http_error",
      },
    );
  }
}
