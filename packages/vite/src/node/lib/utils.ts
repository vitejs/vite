export function deepMerge(
  a: Record<string, any>,
  b: Record<string, any>
): Record<string, any> {
  const merged: Record<string, any> = { ...a }
  for (const key in b) {
    const value = b[key]
    const existing = merged[key]
    if (Array.isArray(existing) && Array.isArray(value)) {
      merged[key] = [...existing, ...value]
      continue
    }
    if (isObject(existing) && isObject(value)) {
      merged[key] = { ...existing, ...value }
      continue
    }
    merged[key] = value
  }
  return merged
}

function isObject(value: unknown) {
  return Object.prototype.toString.call(value) === '[object Object]'
}
