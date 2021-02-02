declare const __MODE__: string
declare const __DEFINES__: Record<string, any>
const that = new Function('return this')()
// shim process
;(that as any).process = (that as any).process || {}
;(that as any).process.env = (that as any).process.env || {}
;(that as any).process.env.NODE_ENV = __MODE__

// assign defines
const defines = __DEFINES__
Object.keys(defines).forEach((key) => {
  const segs = key.split('.')
  let target = that as any
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i]
    if (i === segs.length - 1) {
      target[seg] = defines[key]
    } else {
      target = target[seg] || (target[seg] = {})
    }
  }
})
