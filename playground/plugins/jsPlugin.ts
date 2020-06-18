export const jsPlugin = {
  transforms: [
    {
      test(id) {
        return id.endsWith('testTransform.js')
      },
      transform(code) {
        return code.replace(/__TEST_TRANSFORM__ = (\d)/, (matched, n) => {
          return `__TEST_TRANSFORM__ = ${Number(n) + 1}`
        })
      }
    }
  ]
}
