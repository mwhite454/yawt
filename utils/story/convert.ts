/**
 * Converts a value to an array of strings, handling both arrays and single strings.
 * Returns undefined if the value is null, undefined, or results in an empty array.
 */
export function toStringArray(value: unknown): string[] | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value)) {
    const result = value
      .filter((v) => typeof v === "string")
      .map((v) => v.trim())
      .filter(Boolean);
    return result.length ? result : undefined;
  }
  if (typeof value === "string") {
    const single = value.trim();
    return single ? [single] : undefined;
  }
  return undefined;
}

/**
 * Converts a value to a string, handling various types.
 * Returns undefined if the value is null, undefined, or results in an empty string.
 */
export function toStringValue(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") {
    const v = value.trim();
    return v ? v : undefined;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return undefined;
}
