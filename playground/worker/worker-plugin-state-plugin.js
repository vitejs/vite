export default () => {
  let count = 0
  return {
    name: 'plugin-for-plugin-state',
    transform(code, id) {
      count++
      if (id.includes('worker/modules/test-state.js')) {
        count++
        return {
          code: code.replace(/state = \d+/, 'state = ' + count),
          map: null,
        }
      }
    },
  }
}
