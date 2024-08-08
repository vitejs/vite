import ModuleEsm from './lib/build-esm.js'
import ModuleModularize from './lib/build-modularize.cjs'

let modEsm
let modModularize

self.onmessage = async () => {
  modEsm ??= await ModuleEsm()
  modModularize ??= await ModuleModularize({
    locateFile: () =>
      new URL('./lib/build-modularize.wasm', import.meta.url).href,
  })
  const data = {
    esm: modEsm.hello('EXPORT_ES6'),
    modularize: modModularize.hello('MODULARIZE'),
  }
  self.postMessage(JSON.stringify(data, null, 2))
}
