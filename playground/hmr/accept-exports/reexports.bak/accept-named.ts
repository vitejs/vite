export { a, b } from './source'

if (import.meta.hot) {
  // import.meta.hot.accept('./source', (m) => {
  //   console.log(`accept-named reexport:${m.a},${m.b}`)
  // })
  import.meta.hot.acceptExports('a', (m) => {
    console.log(`accept-named reexport:${m.a},${m.b}`)
  })
}
