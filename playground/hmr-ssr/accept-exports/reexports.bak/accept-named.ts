export { a, b } from './source'

if (import.meta.hot) {
  // import.meta.hot.accept('./source', (m) => {
  //   log(`accept-named reexport:${m.a},${m.b}`)
  // })
  import.meta.hot.acceptExports('a', (m) => {
    log(`accept-named reexport:${m.a},${m.b}`)
  })
}
