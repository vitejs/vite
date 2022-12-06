const __CONFIG_LOADED__: boolean = true
export default {
  define: { __CONFIG_LOADED__ },
  logLevel: 'silent',
  build: {
    minify: false,
    sourcemap: false,
    lib: { entry: 'index.js', fileName: 'index', formats: ['es'] },
  },
}
