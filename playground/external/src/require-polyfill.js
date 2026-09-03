import slash3 from 'slash3'
import * as vue from 'vue'

export default (id) => {
  if (id === 'vue') return vue
  if (id === 'slash3') return slash3
  throw new Error(`Cannot require "${id}"`)
}
