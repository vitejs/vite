export default () => ({
  name: 'plugin-for-worker',
  transform(code, id) {
    if (id.includes('worker/modules/test-plugin.js')) {
      return {
        // keep length for sourcemap
        code: code.replace('plugin fail.   ', 'plugin success!'),
        map: null,
      }
    }
  },
})
