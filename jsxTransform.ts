import { transform } from '@babel/core'

// todo hmr
export function transformVueJsx(code: string, filename: string) {
  const result = transform(code, {
    plugins: ['transform-vue-jsx'],
    filename,
    sourceMaps: true,
  })!

  return {
    code: result.code as string,
    map: result.map as any,
  }
}
