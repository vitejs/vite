self.postMessage(
  [
    'A string',
    import.meta.env.BASE_URL,
    self.location.url,
    import.meta && import.meta.url,
    import.meta.url,
  ].join(' '),
)

// for sourcemap
console.log('url-worker.js')
