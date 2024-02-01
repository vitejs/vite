export const x = 'X'

if (import.meta.hot) {
  import.meta.hot.acceptExports(['x'], (m) => {
    log(`reloaded >>> ${m.x}`)
  })
}
