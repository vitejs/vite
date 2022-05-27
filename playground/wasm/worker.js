import init from './add.wasm?init'
init().then(({ exports }) => {
  // eslint-disable-next-line no-undef
  self.postMessage({ result: exports.add(1, 2) })
})
