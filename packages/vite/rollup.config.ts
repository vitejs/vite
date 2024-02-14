import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import MagicString from 'magic-string'
import type { Plugin, RollupOptions } from 'rollup'
import { defineConfig } from 'rollup'
import { minify as esbuildMinifyPlugin } from 'rollup-plugin-esbuild'
import licensePlugin from './rollupLicensePlugin'

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url)).toString(),
)

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const envConfig = defineConfig({
  input: path.resolve(__dirname, 'src/client/env.ts'),
  plugins: [
    typescript({
      tsconfig: path.resolve(__dirname, 'src/client/tsconfig.json'),
    }),
  ],
  output: {
    file: path.resolve(__dirname, 'dist/client', 'env.mjs'),
    sourcemap: true,
    sourcemapPathTransform(relativeSourcePath) {
      return path.basename(relativeSourcePath)
    },
    sourcemapIgnoreList() {
      return true
    },
  },
})

const clientConfig = defineConfig({
  input: path.resolve(__dirname, 'src/client/client.ts'),
  external: ['./env', '@vite/env'],
  plugins: [
    typescript({
      tsconfig: path.resolve(__dirname, 'src/client/tsconfig.json'),
    }),
  ],
  output: {
    file: path.resolve(__dirname, 'dist/client', 'client.mjs'),
    sourcemap: true,
    sourcemapPathTransform(relativeSourcePath) {
      return path.basename(relativeSourcePath)
    },
    sourcemapIgnoreList() {
      return true
    },
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

function createNodePlugins(
  isProduction: boolean,
  sourceMap: boolean,
  declarationDir: string | false,
): (Plugin | false)[] {
  return [
    nodeResolve({ preferBuiltins: true }),
    typescript({
      tsconfig: path.resolve(__dirname, 'src/node/tsconfig.json'),
      sourceMap,
      declaration: declarationDir !== false,
      declarationDir: declarationDir !== false ? declarationDir : undefined,
    }),

    // Some deps have try...catch require of optional deps, but rollup will
    // generate code that force require them upfront for side effects.
    // Shim them with eval() so rollup can skip these calls.
    isProduction &&
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
        'lilconfig/dist/index.js': {
          pattern: /: require,/g,
          replacement: `: __require,`,
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

    commonjs({
      extensions: ['.js'],
      // Optional peer deps of ws. Native deps that are mostly for performance.
      // Since ws is not that perf critical for us, just ignore these deps.
      ignore: ['bufferutil', 'utf-8-validate'],
    }),
    json(),
    isProduction &&
      licensePlugin(
        path.resolve(__dirname, 'LICENSE.md'),
        'Vite core license',
        'Vite',
      ),
    cjsPatchPlugin(),
  ]
}

function createNodeConfig(isProduction: boolean) {
  return defineConfig({
    ...sharedNodeOptions,
    input: {
      index: path.resolve(__dirname, 'src/node/index.ts'),
      cli: path.resolve(__dirname, 'src/node/cli.ts'),
      constants: path.resolve(__dirname, 'src/node/constants.ts'),
    },
    output: {
      ...sharedNodeOptions.output,
      sourcemap: !isProduction,
    },
    external: [
      /^vite\//,
      'fsevents',
      'lightningcss',
      'rollup/parseAst',
      ...Object.keys(pkg.dependencies),
      ...(isProduction ? [] : Object.keys(pkg.devDependencies)),
    ],
    plugins: createNodePlugins(
      isProduction,
      !isProduction,
      // in production we use rollup.dts.config.ts for dts generation
      // in development we need to rely on the rollup ts plugin
      isProduction ? false : './dist/node',
    ),
  })
}

function createRuntimeConfig(isProduction: boolean) {
  return defineConfig({
    ...sharedNodeOptions,
    input: {
      runtime: path.resolve(__dirname, 'src/runtime/index.ts'),
    },
    output: {
      ...sharedNodeOptions.output,
      sourcemap: !isProduction,
    },
    external: [
      'fsevents',
      'lightningcss',
      'rollup/parseAst',
      ...Object.keys(pkg.dependencies),
    ],
    plugins: [
      ...createNodePlugins(
        false,
        !isProduction,
        // in production we use rollup.dts.config.ts for dts generation
        // in development we need to rely on the rollup ts plugin
        isProduction ? false : './dist/node',
      ),
      esbuildMinifyPlugin({ minify: false, minifySyntax: true }),
      {
        name: 'replace bias',
        transform(code, id) {
          if (id.includes('@jridgewell+trace-mapping')) {
            return {
              code: code.replaceAll(
                'bias === LEAST_UPPER_BOUND',
                'true' +
                  `/*${'bias === LEAST_UPPER_BOUND'.length - '/**/'.length - 'true'.length}*/`,
              ),
              map: null,
            }
          }
        },
      },
      bundleSizeLimit(44),
    ],
  })
}

function createCjsConfig(isProduction: boolean) {
  return defineConfig({
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
    external: [
      'fsevents',
      ...Object.keys(pkg.dependencies),
      ...(isProduction ? [] : Object.keys(pkg.devDependencies)),
    ],
    plugins: [...createNodePlugins(false, false, false), bundleSizeLimit(165)],
  })
}

export default (commandLineArgs: any): RollupOptions[] => {
  const isDev = commandLineArgs.watch
  const isProduction = !isDev

  return defineConfig([
    envConfig,
    clientConfig,
    createNodeConfig(isProduction),
    createRuntimeConfig(isProduction),
    createCjsConfig(isProduction),
  ])
}

// #region ======== Plugins ========

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

          return {
            code: magicString.toString(),
            map: magicString.generateMap({ hires: 'boundary' }),
          }
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
      // don't patch runtime utils chunk because it should stay lightweight and we know it doesn't use require
      if (
        chunk.name === 'utils' &&
        chunk.moduleIds.some((id) => id.endsWith('/ssr/runtime/utils.ts'))
      )
        return
      const match = code.match(/^(?:import[\s\S]*?;\s*)+/)
      const index = match ? match.index! + match[0].length : 0
      const s = new MagicString(code)
      // inject after the last `import`
      s.appendRight(index, cjsPatch)
      console.log('patched cjs context: ' + chunk.fileName)

      return {
        code: s.toString(),
        map: s.generateMap({ hires: 'boundary' }),
      }
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
