import { parse } from "$std/yaml/mod.ts";
import type { SceneDerived } from "./types.ts";

const MAX_FRONTMATTER_BYTES = 64 * 1024;

export interface FrontmatterResult {
  attributes: Record<string, unknown>;
  body: string;
}

function toStringArray(value: unknown): string[] | undefined {
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

function toStringValue(value: unknown): string | undefined {
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

function asPlainObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function extractYamlFrontmatter(text: string): FrontmatterResult {
  const match = text.match(
    /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/, // yaml capture group
  );

  if (!match) return { attributes: {}, body: text };

  const yaml = match[1] ?? "";
  if (new TextEncoder().encode(yaml).byteLength > MAX_FRONTMATTER_BYTES) {
    return { attributes: {}, body: text };
  }

  try {
    const parsed = parse(yaml);
    return {
      attributes: asPlainObject(parsed),
      body: text.slice(match[0].length),
    };
  } catch {
    return { attributes: {}, body: text };
  }
}

export function deriveSceneFields(text: string): SceneDerived {
  const { attributes } = extractYamlFrontmatter(text);

  return {
    title: toStringValue(attributes.title),
    chapter: attributes.chapter as string | number | undefined,
    section: toStringValue(attributes.section),
    timelineIds: toStringArray(
      attributes.timelineIds ?? attributes.timelines ?? attributes.timeline,
    ),
    locationId: toStringValue(attributes.locationId ?? attributes.location_id),
    characterIds: toStringArray(
      attributes.characterIds ?? attributes.characters,
    ),
    tags: toStringArray(attributes.tags ?? attributes.plotlines),
    startDate: toStringValue(attributes.startDate ?? attributes.start_date),
    endDate: toStringValue(attributes.endDate ?? attributes.end_date),
  };
}
