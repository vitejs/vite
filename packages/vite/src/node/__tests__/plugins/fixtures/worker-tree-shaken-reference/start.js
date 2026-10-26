export const createWorker = () =>
  new Worker(new URL('./outer.worker.js', import.meta.url), { type: 'module' })
