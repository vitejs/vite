export function startHelper() {
  return new Worker(new URL('./helper.js', import.meta.url))
}
