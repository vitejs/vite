import path from 'path'
import { promises as fs } from 'fs'
import {
  rollup as Rollup,
  Plugin,
  InputOptions,
  OutputOptions,
  RollupOutput
} from 'rollup'
import { resolveVue } from './resolveVue'
import { hmrClientId } from './serverPluginHmr'
import resolve from 'resolve-from'
import chalk from 'chalk'
import { Resolver, createResolver } from './resolver'

const debugBuild = require('debug')('vite:build')

export interface BuildOptions {
  root?: string
  cdn?: boolean
  resolvers?: Resolver[]
  // list files that are included in the build, but not inside project root.
  srcRoots?: string[]
  rollupInputOptions?: InputOptions
  rollupOutputOptions?: OutputOptions
  write?: boolean // if false, does not write to disk.
  debug?: boolean // if true, generates non-minified code for inspection.
  cssFileName?: string
}

export interface BuildResult {
  js: RollupOutput['output']
  css: string
  html: string
}

export async function build({
  root = process.cwd(),
  cdn = !resolveVue(root).hasLocalVue,
  resolvers = [],
  srcRoots = [],
  rollupInputOptions = {},
  rollupOutputOptions = {},
  write = true,
  debug = false,
  cssFileName = 'style.css'
}: BuildOptions = {}): Promise<BuildResult> {
  process.env.NODE_ENV = 'production'

  const start = Date.now()

  // lazy require rollup so that we don't load it when only using the dev server
  // importing it just for the types
  const rollup = require('rollup').rollup as typeof Rollup
  const outDir = rollupOutputOptions.dir || path.resolve(root, 'dist')

  const indexPath = path.resolve(root, 'index.html')
  const scriptRE = /<script\b[^>]*>([\s\S]*?)<\/script>/gm

  let indexContent: string | null = null
  try {
    indexContent = await fs.readFile(indexPath, 'utf-8')
  } catch (e) {
    // no index
  }

  // make sure to use the same verison of vue from the CDN.
  const vueVersion = resolveVue(root).version
  const cdnLink = `https://unpkg.com/vue@${vueVersion}/dist/vue.esm-browser.prod.js`

  const resolver = createResolver(root, resolvers)
  srcRoots.push(root)

  const vitePlugin: Plugin = {
    name: 'vite',
    resolveId(id: string) {
      if (id === hmrClientId) {
        return hmrClientId
      } else if (id.startsWith('/')) {
        // if id starts with any of the src root directories, it's a file request
        if (srcRoots.some((root) => id.startsWith(root))) {
          debugBuild(`[resolve] pass `, id)
          return
        } else {
          debugBuild(`[resolve]`, id, `-->`, resolver.requestToFile(id))
          return resolver.requestToFile(id)
        }
      } else if (id === 'vue') {
        if (!cdn) {
          return resolveVue(root, true).vue
        } else {
          return {
            id: cdnLink,
            external: true
          }
        }
      } else {
        const request = resolver.idToRequest(id)
        if (request) {
          debugBuild(
            `[resolve]`,
            id,
            `-->`,
            request,
            `--> `,
            resolver.requestToFile(request)
          )
          return resolver.requestToFile(request)
        }
      }
    },
    load(id: string) {
      if (id === hmrClientId) {
        return `export const hot = {}`
      } else if (id === indexPath) {
        let script = ''
        if (indexContent) {
          let match
          while ((match = scriptRE.exec(indexContent))) {
            // TODO handle <script type="module" src="..."/>
            // just add it as an import
            script += match[1]
          }
        }
        return script
      }
    }
  }

  const styles: Map<string, string> = new Map()
  let css = ''
  const cssExtractPlugin: Plugin = {
    name: 'vite-css',
    transform(code: string, id: string) {
      if (id.endsWith('.css')) {
        styles.set(id, code)
        return '/* css extracted by vite */'
      }
    },

    async generateBundle(_options, bundle) {
      // finalize extracted css
      styles.forEach((s) => {
        css += s
      })
      // minify with cssnano
      if (!debug) {
        css = (
          await require('postcss')([require('cssnano')]).process(css, {
            from: undefined
          })
        ).css
      }

      bundle[cssFileName] = {
        isAsset: true,
        type: 'asset',
        fileName: cssFileName,
        source: css
      }
    }
  }

  const bundle = await rollup({
    input: path.resolve(root, 'index.html'),
    ...rollupInputOptions,
    plugins: [
      ...(rollupInputOptions.plugins || []),
      vitePlugin,
      require('rollup-plugin-vue')({
        // TODO: for now we directly handle pre-processors in rollup-plugin-vue
        // so that we don't need to install dedicated rollup plugins.
        // In the future we probably want to still use rollup plugins so that
        // preprocessors are also supported by importing from js files.
        preprocessStyles: true,
        preprocessCustomRequire: (id: string) => require(resolve(root, id))
        // TODO proxy cssModules config
      }),
      require('@rollup/plugin-node-resolve')({
        rootDir: root
      }),
      require('@rollup/plugin-replace')({
        'process.env.NODE_ENV': '"production"',
        __DEV__: 'false'
      }),
      cssExtractPlugin,
      ...(debug ? [] : [require('rollup-plugin-terser').terser()])
    ],
    onwarn(warning, warn) {
      if (warning.code !== 'CIRCULAR_DEPENDENCY') {
        warn(warning)
      }
    }
  })

  const { output } = await bundle.generate({
    dir: outDir,
    format: 'es',
    ...rollupOutputOptions
  })

  let generatedIndex = indexContent && indexContent.replace(scriptRE, '').trim()
  // TODO handle public path for injections?
  // this would also affect paths in templates and css.
  if (generatedIndex) {
    // inject css link
    generatedIndex = injectCSS(generatedIndex, cssFileName)
    if (cdn) {
      // if not inlining vue, inject cdn link so it can start the fetch early
      generatedIndex = injectScript(generatedIndex, cdnLink)
    }
  }

  if (write) {
    await fs.rmdir(outDir, { recursive: true })
    await fs.mkdir(outDir, { recursive: true })
  }

  // inject / write bundle
  for (const chunk of output) {
    if (chunk.type === 'chunk') {
      if (chunk.isEntry && generatedIndex) {
        // inject chunk to html
        generatedIndex = injectScript(generatedIndex, chunk.fileName)
      }
      // write chunk
      if (write) {
        const filepath = path.join(outDir, chunk.fileName)
        console.log(
          `write ${chalk.cyan(path.relative(process.cwd(), filepath))}`
        )
        await fs.mkdir(path.dirname(filepath), { recursive: true })
        await fs.writeFile(filepath, chunk.code)
      }
    } else {
      // write asset
      const filepath = path.join(outDir, chunk.fileName)
      console.log(
        `write ${chalk.magenta(path.relative(process.cwd(), filepath))}`
      )
      await fs.mkdir(path.dirname(filepath), { recursive: true })
      await fs.writeFile(filepath, chunk.source)
    }
  }

  if (write) {
    // write html
    if (generatedIndex) {
      const indexOutPath = path.join(outDir, 'index.html')
      console.log(
        `write ${chalk.green(path.relative(process.cwd(), indexOutPath))}`
      )
      await fs.writeFile(indexOutPath, generatedIndex)
    }
  }
  console.log(`done in ${((Date.now() - start) / 1000).toFixed(2)}s.`)

  return {
    js: output,
    html: generatedIndex || '',
    css
  }
}

function injectCSS(html: string, filename: string) {
  const tag = `<link rel="stylesheet" href="./${filename}">`
  if (/<\/head>/.test(html)) {
    return html.replace(/<\/head>/, `${tag}\n</head>`)
  } else {
    return tag + '\n' + html
  }
}

function injectScript(html: string, filename: string) {
  filename = /^https?:\/\//.test(filename) ? filename : `./${filename}`
  const tag = `<script type="module" src="${filename}"></script>`
  if (/<\/body>/.test(html)) {
    return html.replace(/<\/body>/, `${tag}\n</body>`)
  } else {
    return html + '\n' + tag
  }
}
