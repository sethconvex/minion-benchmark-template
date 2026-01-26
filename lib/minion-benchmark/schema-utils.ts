/**
 * Schema Utilities
 *
 * Helpers for converting Zod schemas to JSON Schema format for UI consumption.
 * This allows the UI to auto-generate forms from behavior config schemas.
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { BehaviorConfigInfo, ConfigFieldInfo } from './types';

/**
 * JSON Schema representation of a behavior config field.
 * Extended version with more properties for internal use.
 */
export interface ConfigFieldSchema {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'array' | 'object';
  description?: string;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  enum?: unknown[];
  required: boolean;
}

/**
 * JSON Schema representation of a behavior config.
 * Extended version with more properties for internal use.
 */
export interface BehaviorConfigSchema {
  fields: ConfigFieldSchema[];
  defaults: Record<string, unknown>;
}

/**
 * Extract a JSON Schema from a Zod schema for UI rendering.
 *
 * @param schema - Zod schema to convert
 * @returns JSON Schema object
 */
export function zodSchemaToJsonSchema(schema: z.ZodType): Record<string, unknown> {
  return zodToJsonSchema(schema, {
    $refStrategy: 'none',
    errorMessages: true,
  }) as Record<string, unknown>;
}

/**
 * Extract UI-friendly field information from a Zod schema.
 *
 * @param schema - Zod schema to extract from
 * @returns BehaviorConfigSchema with field info and defaults
 */
export function extractConfigSchema(schema: z.ZodType): BehaviorConfigSchema {
  const jsonSchema = zodSchemaToJsonSchema(schema);
  const fields: ConfigFieldSchema[] = [];
  const defaults: Record<string, unknown> = {};

  // Handle object schemas
  if (jsonSchema.type === 'object' && jsonSchema.properties) {
    const properties = jsonSchema.properties as Record<string, Record<string, unknown>>;
    const required = (jsonSchema.required as string[]) || [];

    for (const [name, prop] of Object.entries(properties)) {
      const field: ConfigFieldSchema = {
        name,
        type: mapJsonSchemaType(prop.type as string),
        description: prop.description as string | undefined,
        default: prop.default,
        required: required.includes(name),
      };

      // Add numeric constraints
      if (prop.minimum !== undefined) field.minimum = prop.minimum as number;
      if (prop.maximum !== undefined) field.maximum = prop.maximum as number;

      // Add string constraints
      if (prop.minLength !== undefined) field.minLength = prop.minLength as number;
      if (prop.maxLength !== undefined) field.maxLength = prop.maxLength as number;

      // Add enum values
      if (prop.enum) field.enum = prop.enum as unknown[];

      fields.push(field);

      // Collect defaults
      if (prop.default !== undefined) {
        defaults[name] = prop.default;
      }
    }
  }

  return { fields, defaults };
}

/**
 * Map JSON Schema type to our simplified type system.
 */
function mapJsonSchemaType(type: string | undefined): ConfigFieldSchema['type'] {
  switch (type) {
    case 'integer':
    case 'number':
      return 'number';
    case 'string':
      return 'string';
    case 'boolean':
      return 'boolean';
    case 'array':
      return 'array';
    case 'object':
      return 'object';
    default:
      return 'string';
  }
}

/**
 * Validate config against a Zod schema and return parsed result with defaults.
 *
 * @param schema - Zod schema to validate against
 * @param config - Raw config object
 * @returns Parsed and validated config with defaults applied
 */
export function parseConfig<T>(schema: z.ZodType<T>, config: unknown): T {
  return schema.parse(config);
}

/**
 * Safely validate config, returning defaults on error.
 *
 * @param schema - Zod schema to validate against
 * @param config - Raw config object
 * @returns Parsed config or result of parsing empty object (defaults)
 */
export function safeParseConfig<T>(schema: z.ZodType<T>, config: unknown): T {
  const result = schema.safeParse(config);
  if (result.success) {
    return result.data;
  }
  // Fall back to defaults
  return schema.parse({});
}

/**
 * Extract config schema in the format expected by BehaviorConfigInfo.
 * This is the format used by the harness API and stored in Convex.
 *
 * @param schema - Zod schema to extract from
 * @returns BehaviorConfigInfo compatible object
 */
export function extractBehaviorConfigInfo(schema: z.ZodType): BehaviorConfigInfo {
  const fullSchema = extractConfigSchema(schema);

  // Convert to the simpler ConfigFieldInfo format
  const fields: ConfigFieldInfo[] = fullSchema.fields.map(field => {
    const result: ConfigFieldInfo = {
      name: field.name,
      // Map complex types to string for UI compatibility
      type: (field.type === 'array' || field.type === 'object') ? 'string' : field.type,
      description: field.description,
      default: field.default,
    };
    if (field.minimum !== undefined) result.minimum = field.minimum;
    if (field.maximum !== undefined) result.maximum = field.maximum;
    return result;
  });

  return {
    fields,
    defaults: fullSchema.defaults,
  };
}
