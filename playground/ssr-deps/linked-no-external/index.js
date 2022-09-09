export const hello = function () {
  // make sure linked package is not externalized so Vite features like
  // import.meta.env works (or handling TS files)
  return import.meta.env.DEV && 'Hello World!'
}
