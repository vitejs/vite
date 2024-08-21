import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import MagicString from 'magic-string'
import type { Plugin } from 'rollup'
import { defineConfig } from 'rollup'
import esbuild, { type Options as esbuildOptions } from 'rollup-plugin-esbuild'
import licensePlugin from './rollupLicensePlugin'

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url)).toString(),
)

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const envConfig = defineConfig({
  input: path.resolve(__dirname, 'src/client/env.ts'),
  plugins: [
    esbuild({
      tsconfig: path.resolve(__dirname, 'src/client/tsconfig.json'),
    }),
  ],
  output: {
    file: path.resolve(__dirname, 'dist/client', 'env.mjs'),
  },
})

const clientConfig = defineConfig({
  input: path.resolve(__dirname, 'src/client/client.ts'),
  external: ['@vite/env'],
  plugins: [
    esbuild({
      tsconfig: path.resolve(__dirname, 'src/client/tsconfig.json'),
    }),
  ],
  output: {
    file: path.resolve(__dirname, 'dist/client', 'client.mjs'),
  },
})

const sharedNodeOptions = defineConfig({
  treeshake: {
    moduleSideEffects: 'no-external',
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
  },
  output: {
    dir: './dist',
    entryFileNames: `node/[name].js`,
    chunkFileNames: 'node/chunks/dep-[hash].js',
    exports: 'named',
    format: 'esm',
    externalLiveBindings: false,
    freeze: false,
  },
  onwarn(warning, warn) {
    if (warning.message.includes('Circular dependency')) {
      return
    }
    warn(warning)
  },
})

function createSharedNodePlugins({
  esbuildOptions,
}: {
  esbuildOptions?: esbuildOptions
}): Plugin[] {
  return [
    nodeResolve({ preferBuiltins: true }),
    esbuild({
      tsconfig: path.resolve(__dirname, 'src/node/tsconfig.json'),
      target: 'node18',
      ...esbuildOptions,
    }),
    commonjs({
      extensions: ['.js'],
      // Optional peer deps of ws. Native deps that are mostly for performance.
      // Since ws is not that perf critical for us, just ignore these deps.
      ignore: ['bufferutil', 'utf-8-validate'],
      sourceMap: false,
    }),
    json(),
  ]
}

const nodeConfig = defineConfig({
  ...sharedNodeOptions,
  input: {
    index: path.resolve(__dirname, 'src/node/index.ts'),
    cli: path.resolve(__dirname, 'src/node/cli.ts'),
    constants: path.resolve(__dirname, 'src/node/constants.ts'),
  },
  external: [
    /^vite\//,
    'fsevents',
    'lightningcss',
    'rollup/parseAst',
    ...Object.keys(pkg.dependencies),
  ],
  plugins: [
    // Some deps have try...catch require of optional deps, but rollup will
    // generate code that force require them upfront for side effects.
    // Shim them with eval() so rollup can skip these calls.
    shimDepsPlugin({
      // chokidar -> fsevents
      'fsevents-handler.js': {
        src: `require('fsevents')`,
        replacement: `__require('fsevents')`,
      },
      // postcss-import -> sugarss
      'process-content.js': {
        src: 'require("sugarss")',
        replacement: `__require('sugarss')`,
      },
      'lilconfig/src/index.js': {
        pattern: /: require;/g,
        replacement: `: __require;`,
      },
      // postcss-load-config calls require after register ts-node
      'postcss-load-config/src/index.js': {
        pattern: /require(?=\((configFile|'ts-node')\))/g,
        replacement: `__require`,
      },
      // postcss-import uses the `resolve` dep if the `resolve` option is not passed.
      // However, we always pass the `resolve` option. Remove this import to avoid
      // bundling the `resolve` dep.
      'postcss-import/index.js': {
        src: 'const resolveId = require("./lib/resolve-id")',
        replacement: 'const resolveId = (id) => id',
      },
      'postcss-import/lib/parse-styles.js': {
        src: 'const resolveId = require("./resolve-id")',
        replacement: 'const resolveId = (id) => id',
      },
    }),
    ...createSharedNodePlugins({}),
    licensePlugin(
      path.resolve(__dirname, 'LICENSE.md'),
      'Vite core license',
      'Vite',
    ),
    cjsPatchPlugin(),
  ],
})

const runtimeConfig = defineConfig({
  ...sharedNodeOptions,
  input: {
    runtime: path.resolve(__dirname, 'src/runtime/index.ts'),
  },
  external: [
    'fsevents',
    'lightningcss',
    'rollup/parseAst',
    ...Object.keys(pkg.dependencies),
  ],
  plugins: [
    ...createSharedNodePlugins({ esbuildOptions: { minifySyntax: true } }),
    bundleSizeLimit(50),
  ],
})

const cjsConfig = defineConfig({
  ...sharedNodeOptions,
  input: {
    publicUtils: path.resolve(__dirname, 'src/node/publicUtils.ts'),
  },
  output: {
    dir: './dist',
    entryFileNames: `node-cjs/[name].cjs`,
    chunkFileNames: 'node-cjs/chunks/dep-[hash].js',
    exports: 'named',
    format: 'cjs',
    externalLiveBindings: false,
    freeze: false,
    sourcemap: false,
  },
  external: ['fsevents', ...Object.keys(pkg.dependencies)],
  plugins: [...createSharedNodePlugins({}), bundleSizeLimit(175)],
})

export default defineConfig([
  envConfig,
  clientConfig,
  nodeConfig,
  runtimeConfig,
  cjsConfig,
])

// #region Plugins

interface ShimOptions {
  src?: string
  replacement: string
  pattern?: RegExp
}

function shimDepsPlugin(deps: Record<string, ShimOptions>): Plugin {
  const transformed: Record<string, boolean> = {}

  return {
    name: 'shim-deps',
    transform(code, id) {
      for (const file in deps) {
        if (id.replace(/\\/g, '/').endsWith(file)) {
          const { src, replacement, pattern } = deps[file]

          const magicString = new MagicString(code)
          if (src) {
            const pos = code.indexOf(src)
            if (pos < 0) {
              this.error(
                `Could not find expected src "${src}" in file "${file}"`,
              )
            }
            transformed[file] = true
            magicString.overwrite(pos, pos + src.length, replacement)
            console.log(`shimmed: ${file}`)
          }

          if (pattern) {
            let match
            while ((match = pattern.exec(code))) {
              transformed[file] = true
              const start = match.index
              const end = start + match[0].length
              magicString.overwrite(start, end, replacement)
            }
            if (!transformed[file]) {
              this.error(
                `Could not find expected pattern "${pattern}" in file "${file}"`,
              )
            }
            console.log(`shimmed: ${file}`)
          }

          return magicString.toString()
        }
      }
    },
    buildEnd(err) {
      if (!err) {
        for (const file in deps) {
          if (!transformed[file]) {
            this.error(
              `Did not find "${file}" which is supposed to be shimmed, was the file renamed?`,
            )
          }
        }
      }
    },
  }
}

/**
 * Inject CJS Context for each deps chunk
 */
function cjsPatchPlugin(): Plugin {
  const cjsPatch = `
import { fileURLToPath as __cjs_fileURLToPath } from 'node:url';
import { dirname as __cjs_dirname } from 'node:path';
import { createRequire as __cjs_createRequire } from 'node:module';

const __filename = __cjs_fileURLToPath(import.meta.url);
const __dirname = __cjs_dirname(__filename);
const require = __cjs_createRequire(import.meta.url);
const __require = require;
`.trimStart()

  return {
    name: 'cjs-chunk-patch',
    renderChunk(code, chunk) {
      if (!chunk.fileName.includes('chunks/dep-')) return
      const match = /^(?:import[\s\S]*?;\s*)+/.exec(code)
      const index = match ? match.index! + match[0].length : 0
      const s = new MagicString(code)
      // inject after the last `import`
      s.appendRight(index, cjsPatch)
      console.log('patched cjs context: ' + chunk.fileName)
      return s.toString()
    },
  }
}

/**
 * Guard the bundle size
 *
 * @param limit size in kB
 */
function bundleSizeLimit(limit: number): Plugin {
  let size = 0

  return {
    name: 'bundle-limit',
    generateBundle(_, bundle) {
      size = Buffer.byteLength(
        Object.values(bundle)
          .map((i) => ('code' in i ? i.code : ''))
          .join(''),
        'utf-8',
      )
    },
    closeBundle() {
      const kb = size / 1000
      if (kb > limit) {
        this.error(
          `Bundle size exceeded ${limit} kB, current size is ${kb.toFixed(
            2,
          )}kb.`,
        )
      }
    },
  }
}

// #endregion
