export const x = 'x'

export const y = 'y'

export default 'z'

console.log('>>> side FX')

document.querySelector('.app').textContent = 'hey'

if (import.meta.hot) {
  import.meta.hot.acceptExports(['default'])
}
