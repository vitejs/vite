export const x = 'x'

export const y = 'y'

export default 'z'

log('>>> side FX')

globalThis.__HMR__['.app'] = 'hey'

if (import.meta.hot) {
  import.meta.hot.acceptExports(['default'])
}
