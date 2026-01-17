export function urlImportWorker() {
  // Testing the ../ path traversal
  const worker = new Worker(new URL('../worker.js', import.meta.url), {
    type: 'module',
  })
  return new Promise((res) => {
    worker.onmessage = (e) => res(e.data)
  })
}
