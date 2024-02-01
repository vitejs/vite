export const foo = 'foo0'

export const bar = 'bar0'

log('-- used --')

if (import.meta.hot) {
  import.meta.hot.acceptExports([])
}
