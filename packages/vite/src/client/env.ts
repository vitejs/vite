import { isDefined } from '../node/utils'
declare const __MODE__: string
declare const __DEFINES__: Record<string, any>

const context = (() => {
  if (isDefined(globalThis)) {
    return globalThis
  } else if (isDefined(self)) {
    return self
  } else if (isDefined(window)) {
    return window
  } else {
    return Function('return this')()
  }
})()

// assign defines
const defines = __DEFINES__
Object.keys(defines).forEach((key) => {
  const segments = key.split('.')
  let target = context
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    if (i === segments.length - 1) {
      target[segment] = defines[key]
    } else {
      target = target[segment] || (target[segment] = {})
    }
  }
})
