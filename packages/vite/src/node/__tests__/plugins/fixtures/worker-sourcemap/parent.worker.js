new Worker(new URL('./child.worker.js', import.meta.url), { type: 'module' })
self.postMessage('parent')
