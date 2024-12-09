export { a } from './circular-a'
export { b } from './circular-b'

// since there is no .accept, it does full reload
import.meta.hot.on('vite:beforeFullReload', () => {
  console.log('full reload')
})
