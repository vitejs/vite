import { transform } from '@babel/core'

// todo hmr
export function transformVueJsx(
  code: string,
  filename: string,
  jsxOptions?: Record<string, any>
) {
  const plugins = []
  if (/\.tsx$/.test(filename)) {
    plugins.push([
      require.resolve('@babel/plugin-transform-typescript'),
      { isTSX: true, allowExtensions: true },
    ])
  }

  const result = transform(code, {
    presets: [[require.resolve('@vue/babel-preset-jsx'), jsxOptions]],
    filename,
    sourceMaps: true,
    plugins,
  })!

  return {
    code: result.code as string,
    map: result.map as any,
  }
}
