import init from './add.wasm'
init().then((exports) => {
  // eslint-disable-next-line no-undef
  console.log(exports)
  self.postMessage({ result: exports.add(1, 2) })
})
