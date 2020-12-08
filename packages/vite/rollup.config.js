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
    shimFsevents(),
    shimCac(),
    typescript({
      target: 'es2019',
      include: ['src/**/*.ts'],
      esModuleInterop: true
    }),
    commonjs(),
    json(),
    // Optional peer deps of ws
    // they do not exist in the tree but will be force required by rollup due
    // to potential side effects. Treat them as virtual empty files.
    ignoreDepPlugin({
      bufferutil: 1,
      'utf-8-validate': 1
    })
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
  }
}

/**
 * @type { (deps: Record<string, any>) => import('rollup').Plugin }
 */
function ignoreDepPlugin(ignoredDeps) {
  return {
    name: 'empty-cjs',
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

// https://github.com/rollup/rollup/blob/master/build-plugins/conditional-fsevents-import.js
// MIT Licensed https://github.com/rollup/rollup/blob/master/LICENSE.md
// Conditionally load fs-events so that we can bundle chokidar.
const FSEVENTS_REQUIRE = "require('fsevents')"
const REPLACEMENT = `require('${path.resolve(
  __dirname,
  'src/node/server/fsEventsImporter'
)}').getFsEvents()`

/**
 * @type { () => import('rollup').Plugin }
 */
function shimFsevents() {
  let transformed = false
  return {
    name: 'conditional-fs-events-import',
    transform(code, id) {
      if (id.endsWith('fsevents-handler.js')) {
        transformed = true
        const requireStatementPos = code.indexOf(FSEVENTS_REQUIRE)
        if (requireStatementPos < 0) {
          throw new Error(
            `Could not find expected fsevents import "${FSEVENTS_REQUIRE}"`
          )
        }
        const magicString = new MagicString(code)
        magicString.overwrite(
          requireStatementPos,
          requireStatementPos + FSEVENTS_REQUIRE.length,
          REPLACEMENT
        )
        return {
          code: magicString.toString(),
          map: magicString.generateMap({ hires: true })
        }
      }
    },
    buildEnd() {
      if (!transformed) {
        this.error(
          'Could not find "fsevents-handler.js", was the file renamed?'
        )
      }
    }
  }
}

/**
 * Cac includes module.exports code even in its mjs files... overwrites the
 * exports of the deps chunk.
 */
const CAC_MODULE_GUARD = `if (typeof module !== "undefined") {`
/**
 * @type { () => import('rollup').Plugin }
 */
function shimCac() {
  let transformed = false
  return {
    name: 'shim-cac',
    transform(code, id) {
      if (id.endsWith('cac/mod.mjs')) {
        transformed = true
        const requireStatementPos = code.indexOf(CAC_MODULE_GUARD)
        if (requireStatementPos < 0) {
          throw new Error(
            `Could not find expected cac module guard "${CAC_MODULE_GUARD}"`
          )
        }
        const magicString = new MagicString(code)
        magicString.overwrite(
          requireStatementPos,
          requireStatementPos + CAC_MODULE_GUARD.length,
          `if (false) {`
        )
        return {
          code: magicString.toString(),
          map: magicString.generateMap({ hires: true })
        }
      }
    },
    buildEnd() {
      if (!transformed) {
        // throw new Error('Could not find "cac/mod.mjs", was the file renamed?')
      }
    }
  }
}

export default [clientConfig, nodeConfig]
