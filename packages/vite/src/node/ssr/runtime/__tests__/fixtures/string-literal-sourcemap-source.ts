// This file contains the marker Vite puts before its inline source map
// in a string literal, which should not be mistaken for an inline map

const text = '//# sourceMappingSource=vite-generated'

export function getMessage() {
  return text
}
