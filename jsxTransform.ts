import { transform } from '@babel/core'

// todo hmr
export function transformVueJsx(code: string, filename: string) {
  const result = transform(code, {
    presets: ['@vue/babel-preset-jsx'],
    filename,
    sourceMaps: true,
  })!

  return {
    code: result.code as string,
    map: result.map as any,
  }
}
