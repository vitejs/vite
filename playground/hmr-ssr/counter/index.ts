let count = 0
export function increment() {
  count++
}
export function getCount() {
  return count
}
// @ts-expect-error not used but this is to test that it works
function neverCalled() {
  import('./dep')
}
