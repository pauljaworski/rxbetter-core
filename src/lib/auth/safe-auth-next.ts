export function getSafeAuthNext(rawNext: string | null): string {
  if (!rawNext) return "/";

  const trimmed = rawNext.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/";

  try {
    const origin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
    const parsed = new URL(trimmed, origin);
    if (parsed.origin !== origin) return "/";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}
