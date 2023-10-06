const chunks = [
  'index',
  'index-legacy',
  'chunk-async',
  'chunk-async-legacy',
  'immutable-chunk',
  'immutable-chunk-legacy',
  'polyfills-legacy',
]

export function fn() {
  return Promise.all(
    chunks.map(async (name) => {
      const response = await fetch(`/assets/${name}.js`)
      return `${name}: ${response.headers.get('Content-Type')}`
    }),
  )
}
