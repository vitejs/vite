import('./dep-cjs-with-json/importer.cjs')
  .then((mod) => {
    self.postMessage({ ok: true, content: JSON.stringify(mod.content) })
  })
  .catch((err) => {
    self.postMessage({ ok: false, error: String(err) })
  })
