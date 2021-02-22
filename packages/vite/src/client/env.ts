declare const __MODE__: string
declare const __DEFINES__: Record<string, any>

const context = (() => {
  if (typeof globalThis !== 'undefined') {
    return globalThis
  } else if (typeof self !== 'undefined') {
    return self
  } else if (typeof window !== 'undefined') {
    return window
  } else {
    return Function('return this')()
  }
})()

// assign defines
const defines = __DEFINES__
Object.keys(defines).forEach((key) => {
  const segs = key.split('.')
  let target = context
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i]
    if (i === segs.length - 1) {
      target[seg] = defines[key]
    } else {
      target = target[seg] || (target[seg] = {})
    }
  }
})
