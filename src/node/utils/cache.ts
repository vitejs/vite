export function cache<T extends (...args: any[]) => any>(fn: T): T {
  let result: ReturnType<T> | undefined
  return ((...args: Parameters<T>) => {
    if (result === undefined)
      result = fn(...args) 
    return result
  }) as T
}
