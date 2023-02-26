import init from './add.wasm?init'
init().then(({ exports }) => {
  self.postMessage({ result: exports.add(1, 2) })
})
