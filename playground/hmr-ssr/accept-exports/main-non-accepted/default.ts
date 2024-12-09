export const x = 'y'

const def = 'def0'

export default def

log(`<<< default: ${def}`)

if (import.meta.hot) {
  import.meta.hot.acceptExports(['x'])
}
