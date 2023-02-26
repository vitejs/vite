export const x = 'X'

if (import.meta.hot) {
  import.meta.hot.acceptExports(['x'], (m) => {
    console.log(`reloaded >>> ${m.x}`)
  })
}
