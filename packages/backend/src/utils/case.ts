/**
 * snake_case 키를 camelCase로 변환 (단일 객체)
 */
export function toCamelCase<T = Record<string, unknown>>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = value;
  }
  return result as T;
}

/**
 * snake_case 키를 camelCase로 변환 (배열)
 */
export function toCamelCaseArray<T = Record<string, unknown>>(arr: Record<string, unknown>[]): T[] {
  return arr.map(obj => toCamelCase<T>(obj));
}
