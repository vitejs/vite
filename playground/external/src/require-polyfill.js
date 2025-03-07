import * as vue from 'vue'
import slash3 from 'slash3'
globalThis.require = (dep) => {
  if (dep === 'vue') return vue
  if (dep === 'slash3') return slash3
  throw new Error(`Cannot require "${dep}"`)
}
