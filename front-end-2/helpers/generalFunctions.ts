export function getFirst60Percent(str: string) {
  const length = str.length;
  const cutoff = Math.floor(length * 0.4);
  return str.substring(0, cutoff);
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
