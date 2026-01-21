export function urlImportWorker() {
  const worker = new Worker(new URL('./worker.js', import.meta.url), {
    type: 'module',
  })
  return new Promise((res) => {
    worker.onmessage = (e) => res(e.data)
  })
}

export function getAssetUrl() {
  return new URL('./logo.png', import.meta.url).href
}
