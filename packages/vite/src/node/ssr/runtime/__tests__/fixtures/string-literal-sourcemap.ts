// This file contains sourceMappingURL pattern in string literals
// which should not crash the module runner

const text = '//# sourceMappingURL=data:application/json;base64,invalidbase64'

export function getMessage() {
  return text
}

export function throwError() {
  throw new Error('Test error for stacktrace')
}
