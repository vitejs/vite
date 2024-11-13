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
    nodeResolve({ preferBuiltins: true }),
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
    moduleSideEffects(id, external) {
      id = id.replaceAll('\\', '/')
      // These nested dependencies should be considered side-effect free
      // as it's not set within their package.json
      if (
        id.includes('node_modules/astring') ||
        id.includes('node_modules/acorn')
      ) {
        return false
      }
      return !external
    },
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
      strictRequires: 'auto',
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
    'rollup/parseAst',
    /^tsx\//,
    ...Object.keys(pkg.dependencies),
    ...Object.keys(pkg.peerDependencies),
  ],
  plugins: [
    // Some deps have try...catch require of optional deps, but rollup will
    // generate code that force require them upfront for side effects.
    // Shim them with eval() so rollup can skip these calls.
    shimDepsPlugin({
      // postcss-import -> sugarss
      'process-content.js': [
        {
          src: 'require("sugarss")',
          replacement: `__require('sugarss')`,
        },
      ],
      'lilconfig/src/index.js': [
        {
          pattern: /: require;/g,
          replacement: ': __require;',
        },
      ],
      'postcss-load-config/src/req.js': [
        {
          src: "const { pathToFileURL } = require('node:url')",
          replacement: `const { fileURLToPath, pathToFileURL } = require('node:url')`,
        },
        {
          src: '__filename',
          replacement: 'fileURLToPath(import.meta.url)',
        },
      ],
      // postcss-import uses the `resolve` dep if the `resolve` option is not passed.
      // However, we always pass the `resolve` option. It also uses `read-cache` if
      // the `load` option is not passed, but we also always pass the `load` option.
      // Remove these two imports to avoid bundling them.
      'postcss-import/index.js': [
        {
          src: 'const resolveId = require("./lib/resolve-id")',
          replacement: 'const resolveId = (id) => id',
        },
        {
          src: 'const loadContent = require("./lib/load-content")',
          replacement: 'const loadContent = () => ""',
        },
      ],
      'postcss-import/lib/parse-styles.js': [
        {
          src: 'const resolveId = require("./resolve-id")',
          replacement: 'const resolveId = (id) => id',
        },
      ],
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

const moduleRunnerConfig = defineConfig({
  ...sharedNodeOptions,
  input: {
    'module-runner': path.resolve(__dirname, 'src/module-runner/index.ts'),
  },
  external: [
    'lightningcss',
    'rollup/parseAst',
    ...Object.keys(pkg.dependencies),
  ],
  plugins: [
    ...createSharedNodePlugins({ esbuildOptions: { minifySyntax: true } }),
    bundleSizeLimit(53),
  ],
})

const cjsConfig = defineConfig({
  ...sharedNodeOptions,
  input: {
    publicUtils: path.resolve(__dirname, 'src/node/publicUtils.ts'),
  },
  output: {
    ...sharedNodeOptions.output,
    entryFileNames: `node-cjs/[name].cjs`,
    chunkFileNames: 'node-cjs/chunks/dep-[hash].js',
    format: 'cjs',
  },
  external: Object.keys(pkg.dependencies),
  plugins: [
    ...createSharedNodePlugins({}),
    bundleSizeLimit(175),
    exportCheck(),
  ],
})

export default defineConfig([
  envConfig,
  clientConfig,
  nodeConfig,
  moduleRunnerConfig,
  cjsConfig,
])

// #region Plugins

interface ShimOptions {
  src?: string
  replacement: string
  pattern?: RegExp
}

function shimDepsPlugin(deps: Record<string, ShimOptions[]>): Plugin {
  const transformed: Record<string, boolean> = {}

  return {
    name: 'shim-deps',
    transform(code, id) {
      for (const file in deps) {
        if (id.replace(/\\/g, '/').endsWith(file)) {
          for (const { src, replacement, pattern } of deps[file]) {
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
            }

            if (pattern) {
              let match
              while ((match = pattern.exec(code))) {
                transformed[file] = true
                const start = match.index
                const end = start + match[0].length
                let _replacement = replacement
                for (let i = 1; i <= match.length; i++) {
                  _replacement = _replacement.replace(`$${i}`, match[i] || '')
                }
                magicString.overwrite(start, end, _replacement)
              }
              if (!transformed[file]) {
                this.error(
                  `Could not find expected pattern "${pattern}" in file "${file}"`,
                )
              }
            }

            code = magicString.toString()
          }

          console.log(`shimmed: ${file}`)

          return code
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
import { createRequire as __cjs_createRequire } from 'node:module';

const __require = __cjs_createRequire(import.meta.url);
`.trimStart()

  return {
    name: 'cjs-chunk-patch',
    renderChunk(code, chunk) {
      if (!chunk.fileName.includes('chunks/dep-')) return
      if (!code.includes('__require')) return

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

function exportCheck(): Plugin {
  return {
    name: 'export-check',
    async writeBundle() {
      // escape import so that it's not bundled while config load
      const dynImport = (id: string) => import(id)

      const esmNamespace = await dynImport('./dist/node/index.js')
      const cjsModuleExports = (await dynImport('./index.cjs')).default
      const cjsModuleExportsKeys = new Set(
        Object.getOwnPropertyNames(cjsModuleExports),
      )
      const lackingExports = Object.keys(esmNamespace).filter(
        (key) => !cjsModuleExportsKeys.has(key),
      )
      if (lackingExports.length > 0) {
        this.error(
          `Exports missing from cjs build: ${lackingExports.join(', ')}.` +
            ` Please update index.cjs or src/publicUtils.ts.`,
        )
      }
    },
  }
}

// #endregion
