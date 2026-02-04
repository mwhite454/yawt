// Shared constants for image upload validation
export const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const MAX_BYTES = 10 * 1024 * 1024; // 10 MiB
