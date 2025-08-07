// This file contains sourceMappingURL pattern in string literals
// which should not crash the module runner

const text = '//# sourceMappingURL=data:application/json;base64,invalidbase64'
console.log(text)

export function getMessage() {
  return text
}
