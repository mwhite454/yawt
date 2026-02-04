import { parse, stringify } from "$std/yaml/mod.ts";
import type { SceneDerived } from "./types.ts";
import { toStringArray, toStringValue } from "./convert.ts";

const MAX_FRONTMATTER_BYTES = 64 * 1024;

export interface FrontmatterResult {
  attributes: Record<string, unknown>;
  body: string;
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

/**
 * Updates the YAML frontmatter in text with new tags, merging with existing attributes.
 * If no frontmatter exists and tags are provided, creates new frontmatter.
 */
export function updateFrontmatterTags(
  text: string,
  newTags: string[],
): string {
  const { attributes, body } = extractYamlFrontmatter(text);

  // If no tags to add and no existing frontmatter, return as-is
  if (newTags.length === 0 && Object.keys(attributes).length === 0) {
    return text;
  }

  // Use newTags as the canonical source (don't fall back to existing tags)
  const updatedAttributes = {
    ...attributes,
    tags: newTags,
  };

  // Remove tags if empty array
  if (
    Array.isArray(updatedAttributes.tags) &&
    updatedAttributes.tags.length === 0
  ) {
    delete updatedAttributes.tags;
  }

  // If no attributes left, return just the body
  if (Object.keys(updatedAttributes).length === 0) {
    return body;
  }

  // Rebuild the text with frontmatter
  const yamlString = stringify(updatedAttributes).trim();
  return `---\n${yamlString}\n---\n${body}`;
}
