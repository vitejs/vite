import { Plugin } from 'vite'

export const jsPlugin: Plugin = {
  transforms: [
    {
      test({ id }) {
        return id.endsWith('testTransform.js')
      },
      transform({ code }) {
        return code.replace(/__TEST_TRANSFORM__ = (\d)/, (_, n) => {
          return `__TEST_TRANSFORM__ = ${Number(n) + 1}`
        })
      }
    }
  ]
}
