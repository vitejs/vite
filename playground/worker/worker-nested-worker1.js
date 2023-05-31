new Worker(new URL('./worker-nested-worker2.js', import.meta.url), {
  type: 'module',
})
