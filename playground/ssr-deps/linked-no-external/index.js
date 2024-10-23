export const hello = function () {
  // make sure linked package is not externalized so Vite features like
  // import.meta.env works (or handling TS files)
  return `Hello World from ${
    import.meta.env.DEV ? 'development' : 'production'
  }!`
}
