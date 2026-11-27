export function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function formatSourceDate(publishedDate: string | null): string | null {
  if (!publishedDate) {
    return null;
  }
  const timestamp = Date.parse(publishedDate);
  if (Number.isNaN(timestamp)) {
    return publishedDate;
  }
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
