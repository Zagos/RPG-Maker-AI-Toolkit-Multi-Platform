/**
 * Converts snake_case keys (Ruby instance vars from bridge) to camelCase,
 * and camelCase keys back to snake_case for write-back.
 * Recursively applies to all objects and arrays.
 */

export function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

export function normalizeKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(normalizeKeys);
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    result[snakeToCamel(k)] = normalizeKeys(v);
  }
  return result;
}

export function denormalizeKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(denormalizeKeys);
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    // Preserve __class key as-is (used by bridge)
    const key = k === "__class" ? k : camelToSnake(k);
    result[key] = denormalizeKeys(v);
  }
  return result;
}
