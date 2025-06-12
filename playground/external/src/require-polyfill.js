import * as vue from 'vue'
import slash3 from 'slash3'

export default (id) => {
  if (id === 'vue') return vue
  if (id === 'slash3') return slash3
  throw new Error(`Cannot require "${id}"`)
}
