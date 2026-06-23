const APP_ORIGIN = "https://rxbetter.local";

export function sanitizeAuthRedirectPath(rawNext: string | null): string {
  const next = rawNext?.trim();
  if (!next) return "/";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/";
  }

  try {
    const parsed = new URL(next, APP_ORIGIN);
    if (parsed.origin !== APP_ORIGIN) return "/";
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
  } catch {
    return "/";
  }
}
