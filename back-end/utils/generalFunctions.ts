import crypto from "crypto";

// Utility function for sleeping
export default function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to create a SHA-256 hash based on document content
export function generateContentHash(data: any) {
  const content = JSON.stringify(data);
  return crypto.createHash("sha256").update(content).digest("hex");
}
