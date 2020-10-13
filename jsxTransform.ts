import { Transform } from 'vite/dist/node/transform'
import { transform } from '@babel/core'

export const jsxTransform: Transform = {
  test({ path }) {
    return /\.(tsx?|jsx?)$/.test(path)
  },
  transform({ id, code }) {
    const result = transform(code, {
      plugins: ['transform-vue-jsx'],
      filename: id,
      sourceMaps: true,
    })!

    return {
      code: result.code as string,
      map: result.map as any,
    }
  },
}
