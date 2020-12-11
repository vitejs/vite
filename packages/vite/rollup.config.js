// @ts-check
import path from 'path'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import MagicString from 'magic-string'

/**
 * @type { import('rollup').RollupOptions }
 */
const clientConfig = {
  input: path.resolve(__dirname, 'src/client/client.ts'),
  plugins: [
    typescript({
      target: 'es2018',
      include: ['src/client/**/*.ts']
    })
  ],
  output: {
    dir: path.resolve(__dirname, 'dist/client')
  }
}

/**
 * @type { import('rollup').RollupOptions }
 */
const nodeConfig = {
  input: {
    index: path.resolve(__dirname, 'src/node/index.ts'),
    cli: path.resolve(__dirname, 'src/node/cli.ts'),
    server: path.resolve(__dirname, 'src/node/server/index.ts')
  },
  external: [
    'fsevents',
    ...Object.keys(require('./package.json').dependencies)
  ],
  plugins: [
    nodeResolve(),
    typescript({
      target: 'es2019',
      include: ['src/**/*.ts'],
      esModuleInterop: true
    }),
    // Some deps have try...catch require of optional deps, but rollup will
    // generate code that force require them upfront for side effects.
    // Shim them with eval() so rollup can skip these calls.
    shimDepsPlugin({
      // chokidar -> fs-events
      'fsevents-handler.js': {
        src: `require('fsevents')`,
        replacement: `eval('require')('fsevents')`
      },
      // cac re-assigns module.exports even in its mjs dist
      [`cac${path.sep}mod.mjs`]: {
        src: `if (typeof module !== "undefined") {`,
        replacement: `if (false) {`
      },
      // postcss-import -> sugarss
      'process-content.js': {
        src: 'require("sugarss")',
        replacement: `eval('require')('sugarss')`
      }
    }),
    // Optional peer deps of ws. Native deps that are mostly for performance.
    // Since ws is not that perf critical for us, just ignore these deps.
    ignoreDepPlugin({
      bufferutil: 1,
      'utf-8-validate': 1
    }),
    commonjs(),
    json()
  ],
  treeshake: {
    moduleSideEffects: 'no-external',
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false
  },
  output: {
    dir: path.resolve(__dirname, 'dist/node'),
    entryFileNames(chunk) {
      if (chunk.name === 'server') {
        return `server/index.js`
      }
      return `[name].js`
    },
    chunkFileNames: 'chunks/[name].js',
    exports: 'named',
    format: 'cjs',
    externalLiveBindings: false,
    freeze: false,
    manualChunks(id) {
      if (id.includes('node_modules')) {
        return 'deps'
      }
    }
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
    warn(warning)
  }
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
        if (id.endsWith(file)) {
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
    buildEnd() {
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
        return ''
      }
    }
  }
}

export default [clientConfig, nodeConfig]
