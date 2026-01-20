export function urlImportWorker() {
  const worker = new Worker(new URL('./worker.js', import.meta.url), {
    type: 'module',
  })
  return new Promise((res) => {
    worker.onmessage = (e) => res(e.data)
  })
}

export function getAssetUrl() {
  // Adding ?url ensures Vite doesn't inline it as base64 since image is small asset
  return new URL('./logo.png?url', import.meta.url).href
}
