export function cache<T>(fn: (...arg: any[]) => T): (...arg: any[]) => T {
  let result: T | null = null
  return function () {
    if (result) return result
    return (result = fn(...arguments))
  }
}
