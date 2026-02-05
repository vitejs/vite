var _padding_______________________
export function outer(fn) {
  return inner(fn)
}
function inner(fn) {
  return fn()
}
