// @ts-check
import fs from 'fs'
import path from 'path'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import alias from '@rollup/plugin-alias'
import license from 'rollup-plugin-license'
import MagicString from 'magic-string'
import chalk from 'chalk'
import fg from 'fast-glob'
import { sync as resolve } from 'resolve'

/**
 * @type { import('rollup').RollupOptions }
 */
const envConfig = {
  input: path.resolve(__dirname, 'src/client/env.ts'),
  plugins: [
    typescript({
      target: 'es2018',
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
}

/**
 * @type { import('rollup').RollupOptions }
 */
const clientConfig = {
  input: path.resolve(__dirname, 'src/client/client.ts'),
  external: ['./env'],
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
    file: path.resolve(__dirname, 'dist/client', 'client.mjs'),
    sourcemap: true
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
    dir: path.resolve(__dirname, 'dist'),
    entryFileNames: `node/[name].js`,
    chunkFileNames: 'node/chunks/dep-[hash].js',
    exports: 'named',
    format: 'cjs',
    externalLiveBindings: false,
    freeze: false,
    sourcemap: true
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
 *
 * @param {boolean} isProduction
 * @returns {import('rollup').RollupOptions}
 */
const createNodeConfig = (isProduction) => {
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
      ...Object.keys(require('./package.json').dependencies),
      ...(isProduction
        ? []
        : Object.keys(require('./package.json').devDependencies))
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
      nodeResolve({ preferBuiltins: true }),
      typescript({
        target: 'es2019',
        include: ['src/**/*.ts', 'types/**'],
        exclude: ['src/**/__tests__/**'],
        esModuleInterop: true,
        // in production we use api-extractor for dts generation
        // in development we need to rely on the rollup ts plugin
        ...(isProduction
          ? {}
          : {
              tsconfig: 'tsconfig.base.json',
              declaration: true,
              declarationDir: path.resolve(__dirname, 'dist/')
            })
      }),
      // Some deps have try...catch require of optional deps, but rollup will
      // generate code that force require them upfront for side effects.
      // Shim them with eval() so rollup can skip these calls.
      isProduction &&
        shimDepsPlugin({
          'plugins/terser.ts': {
            src: `require.resolve('terser'`,
            replacement: `require.resolve('vite/dist/node/terser'`
          },
          // chokidar -> fsevents
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
          'import-from/index.js': {
            pattern: /require\(resolveFrom/g,
            replacement: `eval('require')(resolveFrom`
          },
          'lilconfig/dist/index.js': {
            pattern: /: require,/g,
            replacement: `: eval('require'),`
          }
        }),
      commonjs({
        extensions: ['.js'],
        // Optional peer deps of ws. Native deps that are mostly for performance.
        // Since ws is not that perf critical for us, just ignore these deps.
        ignore: ['bufferutil', 'utf-8-validate']
      }),
      json(),
      isProduction && licensePlugin()
    ]
  }

  return nodeConfig
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
 * @type { (deps: Record<string, { src?: string, replacement: string, pattern?: RegExp }>) => import('rollup').Plugin }
 */
function shimDepsPlugin(deps) {
  const transformed = {}

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
            if (author && author.name) {
              names.add(author.name)
            }
            for (const person of maintainers.concat(contributors)) {
              if (person && person.name) {
                names.add(person.name)
              }
            }
            if (names.size > 0) {
              text += `By: ${Array.from(names).join(', ')}\n`
            }
            if (repository) {
              text += `Repository: ${repository.url || repository}\n`
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
        `${Array.from(licenses).join(', ')}\n\n` +
        `# Bundled dependencies:\n` +
        dependencyLicenseTexts
      const existingLicenseText = fs.readFileSync('LICENSE.md', 'utf8')
      if (existingLicenseText !== licenseText) {
        fs.writeFileSync('LICENSE.md', licenseText)
        console.warn(
          chalk.yellow(
            '\nLICENSE.md updated. You should commit the updated file.\n'
          )
        )
      }
    }
  })
}

export default (commandLineArgs) => {
  const isDev = commandLineArgs.watch
  const isProduction = !isDev

  return [
    envConfig,
    clientConfig,
    createNodeConfig(isProduction),
    ...(isProduction ? [terserConfig] : [])
  ]
}
