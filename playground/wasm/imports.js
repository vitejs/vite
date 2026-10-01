let lastResult

export function imported_func(result) {
  lastResult = result
}

export function getResult() {
  return lastResult
}
