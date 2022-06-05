/* eslint-disable no-restricted-globals */
import fs from 'fs'
import path from 'path'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import alias from '@rollup/plugin-alias'
import license from 'rollup-plugin-license'
import MagicString from 'magic-string'
import colors from 'picocolors'
import fg from 'fast-glob'
import { sync as resolve } from 'resolve'
import type { Plugin } from 'rollup'
import { defineConfig } from 'rollup'
import pkg from './package.json'

const envConfig = defineConfig({
  input: path.resolve(__dirname, 'src/client/env.ts'),
  plugins: [
    typescript({
      tsconfig: false,
      target: 'es2020',
      module: 'esnext',
      include: ['src/client/env.ts'],
      baseUrl: path.resolve(__dirname, 'src/env'),
      paths: {
        'types/*': ['../../types/*']
      }
    })
  ],
  output: {
    file: path.resolve(__dirname, 'dist/client', 'env.mjs'),
    sourcemap: true
  }
})

const clientConfig = defineConfig({
  input: path.resolve(__dirname, 'src/client/client.ts'),
  external: ['./env', '@vite/env'],
  plugins: [
    typescript({
      tsconfig: false,
      target: 'es2020',
      include: ['src/client/**/*.ts'],
      baseUrl: path.resolve(__dirname, 'src/client'),
      paths: {
        'types/*': ['../../types/*']
      }
    })
  ],
  output: {
    file: path.resolve(__dirname, 'dist/client', 'client.mjs'),
    sourcemap: true
  }
})

const sharedNodeOptions = defineConfig({
  treeshake: {
    moduleSideEffects: 'no-external',
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false
  },
  output: {
    dir: path.resolve(__dirname, 'dist'),
    entryFileNames: `node/[name].js`,
    chunkFileNames: 'node/chunks/dep-[hash].js',
    exports: 'named',
    format: 'esm',
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
})

function createNodePlugins(
  isProduction: boolean,
  sourceMap: boolean,
  declarationDir: string | false
): Plugin[] {
  return [
    alias({
      // packages with "module" field that doesn't play well with cjs bundles
      entries: {
        '@vue/compiler-dom': require.resolve(
          '@vue/compiler-dom/dist/compiler-dom.cjs.js'
        )
      }
    }),
    nodeResolve({ preferBuiltins: true }),
    typescript({
      tsconfig: 'src/node/tsconfig.json',
      module: 'esnext',
      target: 'es2020',
      include: ['src/**/*.ts', 'types/**'],
      exclude: ['src/**/__tests__/**'],
      esModuleInterop: true,
      sourceMap,
      declaration: declarationDir !== false,
      declarationDir: declarationDir !== false ? declarationDir : undefined
    }),

    // Some deps have try...catch require of optional deps, but rollup will
    // generate code that force require them upfront for side effects.
    // Shim them with eval() so rollup can skip these calls.
    isProduction &&
      shimDepsPlugin({
        'plugins/terser.ts': {
          src: `require.resolve('terser'`,
          replacement: `require.resolve('vite/terser'`
        },
        // chokidar -> fsevents
        'fsevents-handler.js': {
          src: `require('fsevents')`,
          replacement: `__require('fsevents')`
        },
        // cac re-assigns module.exports even in its mjs dist
        'cac/dist/index.mjs': {
          src: `if (typeof module !== "undefined") {`,
          replacement: `if (false) {`
        },
        // postcss-import -> sugarss
        'process-content.js': {
          src: 'require("sugarss")',
          replacement: `__require('sugarss')`
        },
        'lilconfig/dist/index.js': {
          pattern: /: require,/g,
          replacement: `: __require,`
        },
        // postcss-load-config calls require after register ts-node
        'postcss-load-config/src/index.js': {
          src: `require(configFile)`,
          replacement: `__require(configFile)`
        },
        // @rollup/plugin-commonjs uses incorrect esm
        '@rollup/plugin-commonjs/dist/index.es.js': {
          src: `import { sync } from 'resolve';`,
          replacement: `import __resolve from 'resolve';const sync = __resolve.sync;`
        }
      }),
    commonjs({
      extensions: ['.js'],
      // Optional peer deps of ws. Native deps that are mostly for performance.
      // Since ws is not that perf critical for us, just ignore these deps.
      ignore: ['bufferutil', 'utf-8-validate']
    }),
    json(),
    isProduction && licensePlugin(),
    cjsPatchPlugin()
  ]
}

function createNodeConfig(isProduction: boolean) {
  return defineConfig({
    ...sharedNodeOptions,
    input: {
      index: path.resolve(__dirname, 'src/node/index.ts'),
      cli: path.resolve(__dirname, 'src/node/cli.ts'),
      constants: path.resolve(__dirname, 'src/node/constants.ts')
    },
    output: {
      ...sharedNodeOptions.output,
      sourcemap: !isProduction
    },
    external: [
      'fsevents',
      ...Object.keys(pkg.dependencies),
      ...(isProduction ? [] : Object.keys(pkg.devDependencies))
    ],
    plugins: createNodePlugins(
      isProduction,
      !isProduction,
      // in production we use api-extractor for dts generation
      // in development we need to rely on the rollup ts plugin
      isProduction ? false : path.resolve(__dirname, 'dist/node')
    )
  })
}

/**
 * Terser needs to be run inside a worker, so it cannot be part of the main
 * bundle. We produce a separate bundle for it and shims plugin/terser.ts to
 * use the production path during build.
 */
const terserConfig = defineConfig({
  ...sharedNodeOptions,
  output: {
    ...sharedNodeOptions.output,
    entryFileNames: `node-cjs/[name].cjs`,
    exports: 'default',
    format: 'cjs',
    sourcemap: false
  },
  input: {
    // eslint-disable-next-line node/no-restricted-require
    terser: require.resolve('terser')
  },
  plugins: [nodeResolve(), commonjs()]
})

function createCjsConfig(isProduction: boolean) {
  return defineConfig({
    ...sharedNodeOptions,
    input: {
      publicUtils: path.resolve(__dirname, 'src/node/publicUtils.ts')
    },
    output: {
      dir: path.resolve(__dirname, 'dist'),
      entryFileNames: `node-cjs/[name].cjs`,
      chunkFileNames: 'node-cjs/chunks/dep-[hash].js',
      exports: 'named',
      format: 'cjs',
      externalLiveBindings: false,
      freeze: false,
      sourcemap: false
    },
    external: [
      'fsevents',
      ...Object.keys(pkg.dependencies),
      ...(isProduction ? [] : Object.keys(pkg.devDependencies))
    ],
    plugins: [...createNodePlugins(false, false, false), bundleSizeLimit(55)]
  })
}

export default (commandLineArgs: any) => {
  const isDev = commandLineArgs.watch
  const isProduction = !isDev

  return defineConfig([
    envConfig,
    clientConfig,
    createNodeConfig(isProduction),
    createCjsConfig(isProduction),
    ...(isProduction ? [terserConfig] : [])
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
                `Could not find expected src "${src}" in file "${file}"`
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
                `Could not find expected pattern "${pattern}" in file "${file}"`
              )
            }
            console.log(`shimmed: ${file}`)
          }

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

function licensePlugin() {
  return license({
    thirdParty(dependencies) {
      // https://github.com/rollup/rollup/blob/master/build-plugins/generate-license-file.js
      // MIT Licensed https://github.com/rollup/rollup/blob/master/LICENSE-CORE.md
      const coreLicense = fs.readFileSync(
        path.resolve(__dirname, '../../LICENSE')
      )
      function sortLicenses(licenses) {
        let withParenthesis = []
        let noParenthesis = []
        licenses.forEach((license) => {
          if (/^\(/.test(license)) {
            withParenthesis.push(license)
          } else {
            noParenthesis.push(license)
          }
        })
        withParenthesis = withParenthesis.sort()
        noParenthesis = noParenthesis.sort()
        return [...noParenthesis, ...withParenthesis]
      }
      const licenses = new Set()
      const dependencyLicenseTexts = dependencies
        .sort(({ name: nameA }, { name: nameB }) =>
          nameA > nameB ? 1 : nameB > nameA ? -1 : 0
        )
        .map(
          ({
            name,
            license,
            licenseText,
            author,
            maintainers,
            contributors,
            repository
          }) => {
            let text = `## ${name}\n`
            if (license) {
              text += `License: ${license}\n`
            }
            const names = new Set()
            for (const person of [author, ...maintainers, ...contributors]) {
              const name = typeof person === 'string' ? person : person?.name
              if (name) {
                names.add(name)
              }
            }
            if (names.size > 0) {
              text += `By: ${Array.from(names).join(', ')}\n`
            }
            if (repository) {
              text += `Repository: ${
                typeof repository === 'string' ? repository : repository.url
              }\n`
            }
            if (!licenseText) {
              try {
                const pkgDir = path.dirname(
                  resolve(path.join(name, 'package.json'), {
                    preserveSymlinks: false
                  })
                )
                const licenseFile = fg.sync(`${pkgDir}/LICENSE*`, {
                  caseSensitiveMatch: false
                })[0]
                if (licenseFile) {
                  licenseText = fs.readFileSync(licenseFile, 'utf-8')
                }
              } catch {}
            }
            if (licenseText) {
              text +=
                '\n' +
                licenseText
                  .trim()
                  .replace(/(\r\n|\r)/gm, '\n')
                  .split('\n')
                  .map((line) => `> ${line}`)
                  .join('\n') +
                '\n'
            }
            licenses.add(license)
            return text
          }
        )
        .join('\n---------------------------------------\n\n')
      const licenseText =
        `# Vite core license\n` +
        `Vite is released under the MIT license:\n\n` +
        coreLicense +
        `\n# Licenses of bundled dependencies\n` +
        `The published Vite artifact additionally contains code with the following licenses:\n` +
        `${sortLicenses(licenses).join(', ')}\n\n` +
        `# Bundled dependencies:\n` +
        dependencyLicenseTexts
      const existingLicenseText = fs.readFileSync('LICENSE.md', 'utf8')
      if (existingLicenseText !== licenseText) {
        fs.writeFileSync('LICENSE.md', licenseText)
        console.warn(
          colors.yellow(
            '\nLICENSE.md updated. You should commit the updated file.\n'
          )
        )
      }
    }
  })
}

/**
 * Inject CJS Context for each deps chunk
 */
function cjsPatchPlugin(): Plugin {
  const cjsPatch = `
import { fileURLToPath as __cjs_fileURLToPath } from 'url';
import { dirname as __cjs_dirname } from 'path';
import { createRequire as __cjs_createRequire } from 'module';

const __filename = __cjs_fileURLToPath(import.meta.url);
const __dirname = __cjs_dirname(__filename);
const require = __cjs_createRequire(import.meta.url);
const __require = require;
`.trimStart()

  return {
    name: 'cjs-chunk-patch',
    renderChunk(code, chunk) {
      if (!chunk.fileName.includes('chunks/dep-')) return

      const match = code.match(/^(?:import[\s\S]*?;\s*)+/)
      const index = match ? match.index + match[0].length : 0
      const s = new MagicString(code)
      // inject after the last `import`
      s.appendRight(index, cjsPatch)
      console.log('patched cjs context: ' + chunk.fileName)

      return {
        code: s.toString(),
        map: s.generateMap()
      }
    }
  }
}

/**
 * Guard the bundle size
 *
 * @param limit size in KB
 */
function bundleSizeLimit(limit: number): Plugin {
  return {
    name: 'bundle-limit',
    generateBundle(options, bundle) {
      const size = Buffer.byteLength(
        Object.values(bundle)
          .map((i) => ('code' in i ? i.code : ''))
          .join(''),
        'utf-8'
      )
      const kb = size / 1024
      if (kb > limit) {
        throw new Error(
          `Bundle size exceeded ${limit}kb, current size is ${kb.toFixed(2)}kb.`
        )
      }
    }
  }
}

// #endregion
