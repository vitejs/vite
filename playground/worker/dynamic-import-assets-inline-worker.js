self.onmessage = function (e) {
  import('./vite.svg').then((res) => {
    self.postMessage({
      type: 'assets',
      msg: 'The vite.svg was loaded successfully.',
    })
  })

  import('@vitejs/test-dep-to-optimize')
    .then((get) => {
      console.log('imported dynamically', get)
      self.postMessage({
        type: 'libs',
        msg: 'The @vitejs/test-dep-to-optimize was loaded successfully.',
      })
    })
    .catch((e) => console.error('imported dynamically', e))
}

// for sourcemap
console.log('dynamic-import-assets-inline-worker.js')
