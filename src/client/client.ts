// This file runs in the browser.

// injected by serverPluginHmr when served
declare const __MODE__: string
declare const __DEFINES__: Record<string, any>
;(window as any).process = {
  env: {
    NODE_ENV: __MODE__
  }
}

const defines = __DEFINES__
Object.keys(defines).forEach((key) => {
  const segs = key.split('.')
  let target = window as any
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i]
    if (i === segs.length - 1) {
      target[seg] = defines[key]
    } else {
      target = target[seg] || (target[seg] = {})
    }
  }
})
