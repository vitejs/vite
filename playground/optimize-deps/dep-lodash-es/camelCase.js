// Minimal camelCase implementation for testing
export default function camelCase(str) {
  return str
    .replace(/[-_\s]+(.)?/g, (_, chr) => (chr ? chr.toUpperCase() : ''))
    .replace(/^[A-Z]/, (chr) => chr.toLowerCase())
}
