export const x = 'x'

export const y = 'y'

export default 'z'

console.log('-- unused --')

if (import.meta.hot) {
  import.meta.hot.acceptExports([])
}
