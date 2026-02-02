import type { FieldDefinition, FieldType } from "./types.ts";

const VALID_FIELD_TYPES: FieldType[] = ["text", "select", "list"];

export function validateFieldDefinitions(
  fields: unknown,
): FieldDefinition[] | string {
  if (!Array.isArray(fields)) {
    return "fields must be an array";
  }

  const validated: FieldDefinition[] = [];

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];

    if (!field || typeof field !== "object" || Array.isArray(field)) {
      return `Field at index ${i} must be an object`;
    }

    const f = field as Record<string, unknown>;

    // Validate name
    if (typeof f.name !== "string" || !f.name.trim()) {
      return `Field at index ${i} must have a non-empty name`;
    }

    // Validate label
    if (typeof f.label !== "string" || !f.label.trim()) {
      return `Field at index ${i} must have a non-empty label`;
    }

    // Validate type
    if (!VALID_FIELD_TYPES.includes(f.type as FieldType)) {
      return `Field at index ${i} has invalid type. Must be one of: ${
        VALID_FIELD_TYPES.join(", ")
      }`;
    }

    // Validate options for select type
    if (f.type === "select") {
      if (!Array.isArray(f.options)) {
        return `Field at index ${i} with type 'select' must have an options array`;
      }
      if (f.options.length === 0) {
        return `Field at index ${i} with type 'select' must have at least one option`;
      }
      for (const opt of f.options) {
        if (typeof opt !== "string") {
          return `Field at index ${i} has non-string option`;
        }
      }
    }

    validated.push({
      name: f.name.trim(),
      label: f.label.trim(),
      type: f.type as FieldType,
      ...(f.options && Array.isArray(f.options) ? { options: f.options } : {}),
      ...(typeof f.required === "boolean" ? { required: f.required } : {}),
    });
  }

  return validated;
}
