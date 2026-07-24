export function getFirst60Percent(str: string) {
  const length = str.length;
  const cutoff = Math.floor(length * 0.4);
  return str.substring(0, cutoff);
}

// The site's own origin — window.location.origin on the client (correct in local dev,
// preview, and prod alike), falling back to the production domain for any SSR/build-time
// codepath that can't reach a real browser origin.
export function getSiteBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://fabulainfantil.com";
}

export function isLocalhost(): boolean {
  if (typeof window !== "undefined") {
    return (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );
  }

  return false;
}
