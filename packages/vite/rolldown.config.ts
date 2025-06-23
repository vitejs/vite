import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import MagicString from 'magic-string'
import type { Plugin } from 'rolldown'
import { defineConfig } from 'rolldown'
import { init, parse } from 'es-module-lexer'
import licensePlugin from './rollupLicensePlugin'

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url)).toString(),
)
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const disableSourceMap = !!process.env.DEBUG_DISABLE_SOURCE_MAP

const envConfig = defineConfig({
  input: path.resolve(__dirname, 'src/client/env.ts'),
  platform: 'browser',
  transform: {
    target: 'es2020',
  },
  output: {
    dir: path.resolve(__dirname, 'dist'),
    entryFileNames: 'client/env.mjs',
  },
})

const clientConfig = defineConfig({
  input: path.resolve(__dirname, 'src/client/client.ts'),
  platform: 'browser',
  transform: {
    target: 'es2020',
  },
  external: ['@vite/env'],
  output: {
    dir: path.resolve(__dirname, 'dist'),
    entryFileNames: 'client/client.mjs',
  },
})

const sharedNodeOptions = defineConfig({
  platform: 'node',
  treeshake: {
    moduleSideEffects: [
      {
        test: /acorn|astring|escape-html/,
        sideEffects: false,
      },
      {
        external: true,
        sideEffects: false,
      },
    ],
    // TODO: not supported yet
    // propertyReadSideEffects: false,
  },
  output: {
    dir: './dist',
    entryFileNames: `node/[name].js`,
    chunkFileNames: 'node/chunks/dep-[hash].js',
    exports: 'named',
    format: 'esm',
    externalLiveBindings: false,
  },
  onwarn(warning, warn) {
    if (warning.message.includes('Circular dependency')) {
      return
    }
    warn(warning)
  },
})

const nodeConfig = defineConfig({
  ...sharedNodeOptions,
  input: {
    index: path.resolve(__dirname, 'src/node/index.ts'),
    cli: path.resolve(__dirname, 'src/node/cli.ts'),
    constants: path.resolve(__dirname, 'src/node/constants.ts'),
  },
  resolve: {
    alias: {
      // we can always use node version (the default entry point has browser support)
      debug: 'debug/src/node.js',
    },
  },
  output: {
    ...sharedNodeOptions.output,
    // When polyfillRequire is enabled, `require` gets renamed by rolldown.
    // But the current usage of require() inside inlined workers expects `require`
    // to not be renamed. To workaround, polyfillRequire is disabled and
    // the banner is used instead.
    // Ideally we should move workers to ESM
    polyfillRequire: false,
    banner:
      "import { createRequire as ___createRequire } from 'module'; const require = ___createRequire(import.meta.url);",
  },
  external: [
    /^vite\//,
    'fsevents',
    'rollup/parseAst',
    /^tsx\//,
    /^#/,
    'sugarss', // postcss-import -> sugarss
    'supports-color',
    'utf-8-validate', // ws
    'bufferutil', // ws
    ...Object.keys(pkg.dependencies),
    ...Object.keys(pkg.peerDependencies),
  ],
  plugins: [
    shimDepsPlugin({
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
    buildTimeImportMetaUrlPlugin(),
    licensePlugin(
      path.resolve(__dirname, 'LICENSE.md'),
      'Vite core license',
      'Vite',
    ),
    writeTypesPlugin(),
    enableSourceMapsInWatchModePlugin(),
    externalizeDepsInWatchPlugin(),
  ],
})

const moduleRunnerConfig = defineConfig({
  ...sharedNodeOptions,
  input: {
    'module-runner': path.resolve(__dirname, 'src/module-runner/index.ts'),
  },
  external: [
    'fsevents',
    'lightningcss',
    'rollup/parseAst',
    ...Object.keys(pkg.dependencies),
  ],
  plugins: [bundleSizeLimit(54), enableSourceMapsInWatchModePlugin()],
  output: {
    ...sharedNodeOptions.output,
    minify: {
      compress: true,
      mangle: false,
      removeWhitespace: false,
    },
  },
})

export default defineConfig([
  envConfig,
  clientConfig,
  nodeConfig,
  moduleRunnerConfig,
])

// #region Plugins

function enableSourceMapsInWatchModePlugin(): Plugin {
  return {
    name: 'enable-source-maps',
    outputOptions(options) {
      if (this.meta.watchMode && !disableSourceMap) {
        options.sourcemap = 'inline'
      }
    },
  }
}

function writeTypesPlugin(): Plugin {
  return {
    name: 'write-types',
    async writeBundle() {
      if (this.meta.watchMode) {
        writeFileSync(
          'dist/node/index.d.ts',
          "export * from '../../src/node/index.ts'",
        )
        writeFileSync(
          'dist/node/module-runner.d.ts',
          "export * from '../../src/module-runner/index.ts'",
        )
      }
    },
  }
}

function externalizeDepsInWatchPlugin(): Plugin {
  return {
    name: 'externalize-deps-in-watch',
    options(options) {
      if (this.meta.watchMode) {
        options.external ||= []
        if (!Array.isArray(options.external))
          throw new Error('external must be an array')
        options.external = options.external.concat(
          Object.keys(pkg.devDependencies),
        )
      }
    },
  }
}

interface ShimOptions {
  src?: string
  replacement: string
  pattern?: RegExp
}

function shimDepsPlugin(deps: Record<string, ShimOptions[]>): Plugin {
  const transformed: Record<string, boolean> = {}

  return {
    name: 'shim-deps',
    transform: {
      filter: {
        id: new RegExp(`(?:${Object.keys(deps).join('|')})$`),
      },
      handler(code, id) {
        const file = Object.keys(deps).find((file) =>
          id.replace(/\\/g, '/').endsWith(file),
        )
        if (!file) return

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
      },
    },
    buildEnd(err) {
      if (this.meta.watchMode) return

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

function buildTimeImportMetaUrlPlugin(): Plugin {
  const idMap: Record<string, number> = {}
  let lastIndex = 0

  const prefix = `__vite_buildTimeImportMetaUrl_`
  const keepCommentRE = /\/\*\*\s*[#@]__KEEP__\s*\*\/\s*$/

  return {
    name: 'import-meta-current-dirname',
    transform: {
      filter: {
        code: 'import.meta.url',
      },
      async handler(code, id) {
        const relativeId = path.relative(__dirname, id).replaceAll('\\', '/')
        // only replace import.meta.url in src/
        if (!relativeId.startsWith('src/')) return

        let index: number
        if (idMap[id]) {
          index = idMap[id]
        } else {
          index = idMap[id] = lastIndex
          lastIndex++
        }

        await init

        const s = new MagicString(code)
        const [imports] = parse(code)
        for (const { t, ss, se } of imports) {
          if (t === 3 && code.slice(se, se + 4) === '.url') {
            // ignore import.meta.url with /** #__KEEP__ */ comment
            if (keepCommentRE.test(code.slice(0, ss))) {
              keepCommentRE.lastIndex = 0
              continue
            }

            // import.meta.url
            s.overwrite(ss, se + 4, `${prefix}${index}`)
          }
        }
        return s.hasChanged() ? s.toString() : undefined
      },
    },
    renderChunk(code, chunk, outputOptions) {
      if (!code.includes(prefix)) return

      return code.replace(
        /__vite_buildTimeImportMetaUrl_(\d+)/g,
        (_, index) => {
          const originalFile = Object.keys(idMap).find(
            (key) => idMap[key] === +index,
          )
          if (!originalFile) {
            throw new Error(
              `Could not find original file for ${prefix}${index} in ${chunk.fileName}`,
            )
          }
          const outputFile = path.resolve(outputOptions.dir!, chunk.fileName)
          const relativePath = path
            .relative(path.dirname(outputFile), originalFile)
            .replaceAll('\\', '/')

          if (outputOptions.format === 'es') {
            return `new URL(${JSON.stringify(relativePath)}, import.meta.url)`
          } else if (outputOptions.format === 'cjs') {
            return `new URL(${JSON.stringify(
              relativePath,
            )}, require('node:url').pathToFileURL(__filename))`
          } else {
            throw new Error(`Unsupported output format ${outputOptions.format}`)
          }
        },
      )
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
      if (this.meta.watchMode) return

      size = Buffer.byteLength(
        Object.values(bundle)
          .map((i) => ('code' in i ? i.code : ''))
          .join(''),
        'utf-8',
      )
    },
    closeBundle() {
      if (this.meta.watchMode) return

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
