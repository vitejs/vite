(() => {})() // this is to test `importScripts` injection doesn't break the code

let base = `/${self.location.pathname.split('/')[1]}`
if (base.endsWith('.js') || base === `/worker-entries`) base = '' // for dev

importScripts(`${base}/classic.js`)

self.addEventListener('message', async (e) => {
  switch (e.data) {
    case 'ping': {
      self.postMessage({
        message: e.data,
        result: self.constant,
      })
      break
    }
    case 'test-import': {
      // Vite may inject imports to handle this dynamic import, make sure
      // it still works in classic workers.
      // NOTE: this test only works in dev.
      const importPath = `${base}/classic-esm.js`
      const { msg } = await import(/* @vite-ignore */ importPath)
      self.postMessage({
        message: e.data,
        result: msg,
      })
      break
    }
  }
})

// for sourcemap
console.log('classic-worker.js')
