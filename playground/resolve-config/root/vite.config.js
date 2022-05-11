export default {
  define: { __CONFIG_LOADED__: true },
  logLevel: 'silent',
  build: {
    minify: false,
    sourcemap: false,
    lib: { entry: 'index.js', fileName: 'index', formats: ['es'] }
  }
}
