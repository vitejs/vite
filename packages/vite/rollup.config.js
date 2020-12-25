// @ts-check
import path from 'path'
import slash from 'slash'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import alias from '@rollup/plugin-alias'
import MagicString from 'magic-string'

/**
 * @type { import('rollup').RollupOptions }
 */
const clientConfig = {
  input: path.resolve(__dirname, 'src/client/client.ts'),
  plugins: [
    typescript({
      target: 'es2018',
      include: ['src/client/**/*.ts'],
      baseUrl: path.resolve(__dirname, 'src/client'),
      paths: {
        'types/*': ['../../types/*']
      }
    })
  ],
  output: {
    dir: path.resolve(__dirname, 'dist/client')
  }
}

/**
 * @type { import('rollup').RollupOptions }
 */
const sharedNodeOptions = {
  treeshake: {
    moduleSideEffects: 'no-external',
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false
  },
  output: {
    dir: path.resolve(__dirname, 'dist/node'),
    entryFileNames: `[name].js`,
    chunkFileNames: 'chunks/dep-[hash].js',
    exports: 'named',
    format: 'cjs',
    externalLiveBindings: false,
    freeze: false
  },
  onwarn(warning, warn) {
    // node-resolve complains a lot about this but seems to still work?
    if (warning.message.includes('Package subpath')) {
      return
    }
    // we use the eval('require') trick to deal with optional deps
    if (warning.message.includes('Use of eval')) {
      return
    }
    if (warning.message.includes('Circular dependency')) {
      return
    }
    warn(warning)
  }
}

/**
 * @type { import('rollup').RollupOptions }
 */
const nodeConfig = {
  ...sharedNodeOptions,
  input: {
    index: path.resolve(__dirname, 'src/node/index.ts'),
    cli: path.resolve(__dirname, 'src/node/cli.ts')
  },
  external: [
    'fsevents',
    ...Object.keys(require('./package.json').dependencies)
  ],
  plugins: [
    alias({
      // packages with "module" field that doesn't play well with cjs bundles
      entries: {
        '@vue/compiler-dom': require.resolve(
          '@vue/compiler-dom/dist/compiler-dom.cjs.js'
        ),
        'big.js': require.resolve('big.js/big.js')
      }
    }),
    nodeResolve(),
    typescript({
      target: 'es2019',
      include: ['src/**/*.ts'],
      esModuleInterop: true,
      baseUrl: path.resolve(__dirname, 'src/node'),
      paths: {
        'types/*': ['../../types/*']
      }
    }),
    // Some deps have try...catch require of optional deps, but rollup will
    // generate code that force require them upfront for side effects.
    // Shim them with eval() so rollup can skip these calls.
    shimDepsPlugin({
      'plugins/terser.ts': {
        src: `require('terser')`,
        replacement: `require('vite/dist/node/terser')`
      },
      // chokidar -> fs-events
      'fsevents-handler.js': {
        src: `require('fsevents')`,
        replacement: `eval('require')('fsevents')`
      },
      // cac re-assigns module.exports even in its mjs dist
      'cac/dist/index.mjs': {
        src: `if (typeof module !== "undefined") {`,
        replacement: `if (false) {`
      },
      // postcss-import -> sugarss
      'process-content.js': {
        src: 'require("sugarss")',
        replacement: `eval('require')('sugarss')`
      },
      'import-fresh/index.js': {
        src: 'require(filePath)',
        replacement: `eval('require')(filePath)`
      }
    }),
    // Optional peer deps of ws. Native deps that are mostly for performance.
    // Since ws is not that perf critical for us, just ignore these deps.
    ignoreDepPlugin({
      bufferutil: 1,
      'utf-8-validate': 1
    }),
    commonjs({ extensions: ['.js'] }),
    json()
  ]
}

/**
 * Terser needs to be run inside a worker, so it cannot be part of the main
 * bundle. We produce a separate bundle for it and shims plugin/terser.ts to
 * use the production path during build.
 *
 * @type { import('rollup').RollupOptions }
 */
const terserConfig = {
  ...sharedNodeOptions,
  output: {
    ...sharedNodeOptions.output,
    exports: 'default'
  },
  input: {
    terser: require.resolve('terser')
  },
  plugins: [nodeResolve(), commonjs()]
}

/**
 * @type { (deps: Record<string, { src: string, replacement: string }>) => import('rollup').Plugin }
 */
function shimDepsPlugin(deps) {
  const transformed = {}

  return {
    name: 'shim-deps',
    transform(code, id) {
      for (const file in deps) {
        if (slash(id).endsWith(file)) {
          const { src, replacement } = deps[file]
          const pos = code.indexOf(src)
          if (pos < 0) {
            this.error(`Could not find expected src "${src}" in file "${file}"`)
          }
          const magicString = new MagicString(code)
          magicString.overwrite(pos, pos + src.length, replacement)
          transformed[file] = true
          console.log(`shimmed: ${file}`)
          return {
            code: magicString.toString(),
            map: magicString.generateMap({ hires: true })
          }
        }
      }
    },
    buildEnd(err) {
      if (!err) {
        for (const file in deps) {
          if (!transformed[file]) {
            this.error(
              `Did not find "${file}" which is supposed to be shimmed, was the file renamed?`
            )
          }
        }
      }
    }
  }
}

/**
 * @type { (deps: Record<string, any>) => import('rollup').Plugin }
 */
function ignoreDepPlugin(ignoredDeps) {
  return {
    name: 'ignore-deps',
    resolveId(id) {
      if (id in ignoredDeps) {
        return id
      }
    },
    load(id) {
      if (id in ignoredDeps) {
        console.log(`ignored: ${id}`)
        return ''
      }
    }
  }
}

export default [clientConfig, nodeConfig, terserConfig]
