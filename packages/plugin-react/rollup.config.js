import path from 'path'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'

/**
 *
 * @param {boolean} isProduction
 * @returns {import('rollup').RollupOptions}
 */
const createNodeConfig = (isProduction) => {
  /**
   * @type { import('rollup').RollupOptions }
   */
  const nodeConfig = {
    input: path.resolve(__dirname, 'src/index.ts'),
    output: [
      {
        file: path.resolve(__dirname, 'dist/index.js'),
        inlineDynamicImports: true,
        exports: 'named',
        format: 'commonjs',
        freeze: false
      }
    ],
    external: [...Object.keys(require('./package.json').dependencies)],
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      typescript({
        tsconfig: 'tsconfig.json',
        module: 'esnext',
        target: 'es2019',
        include: ['src/**/*.ts'],
        esModuleInterop: true
      }),
      commonjs({
        extensions: ['.js']
      })
    ]
  }

  return nodeConfig
}

export default (commandLineArgs) => {
  const isDev = commandLineArgs.watch
  const isProduction = !isDev

  return [createNodeConfig(isProduction)]
}
