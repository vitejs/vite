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
  srcRoots?: string[]
  rollupInputOptions?: InputOptions
  rollupOutputOptions?: OutputOptions
  write?: boolean
  debug?: boolean
  indexPath?: string
}

export interface BuildResult {
  output: RollupOutput['output']
  css: string
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
  indexPath = path.resolve(root, 'index.html')
}: BuildOptions = {}): Promise<BuildResult> {
  process.env.NODE_ENV = 'production'

  const start = Date.now()

  // lazy require rollup so that we don't load it when only using the dev server
  // importing it just for the types
  const rollup = require('rollup').rollup as typeof Rollup
  const outDir = rollupOutputOptions.dir || path.resolve(root, 'dist')
  const scriptRE = /<script\b[^>]*>([\s\S]*?)<\/script>/gm

  let indexContent = await fs.readFile(indexPath, 'utf-8')
  const cssFilename = 'style.css'

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
        let match
        while ((match = scriptRE.exec(indexContent))) {
          // TODO handle <script type="module" src="..."/>
          // just add it as an import
          script += match[1]
        }
        return script
      }
    }
  }

  const styles: Map<string, string> = new Map()

  const cssExtractPlugin: Plugin = {
    name: 'vite-css',
    transform(code: string, id: string) {
      if (id.endsWith('.css')) {
        styles.set(id, code)
        return '/* css extracted by vite */'
      }
    }
  }

  const bundle = await rollup({
    input: path.resolve(root, 'index.html'),
    preserveEntrySignatures: false,
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

  // finalize extracted css
  let css = ''
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

  // if no custom input, this is a default build with index.html as entry.
  // directly write to disk.
  if (write) {
    await fs.rmdir(outDir, { recursive: true })
    await fs.mkdir(outDir, { recursive: true })

    let generatedIndex = indexContent.replace(scriptRE, '').trim()
    // TODO handle public path for injections?
    // this would also affect paths in templates and css.
    // inject css link
    generatedIndex = injectCSS(generatedIndex, cssFilename)
    if (cdn) {
      // if not inlining vue, inject cdn link so it can start the fetch early
      generatedIndex = injectScript(generatedIndex, cdnLink)
    }

    // write javascript chunks
    for (const chunk of output) {
      if (chunk.type === 'chunk') {
        if (chunk.isEntry) {
          // inject chunk to html
          generatedIndex = injectScript(generatedIndex, chunk.fileName)
        }
        // write chunk
        const filepath = path.join(outDir, chunk.fileName)
        console.log(
          `write ${chalk.cyan(path.relative(process.cwd(), filepath))}`
        )
        await fs.writeFile(filepath, chunk.code)
      }
    }

    // write css
    const cssFilepath = path.join(outDir, cssFilename)
    console.log(
      `write ${chalk.magenta(path.relative(process.cwd(), cssFilepath))}`
    )
    await fs.writeFile(cssFilepath, css)

    // write html
    const indexOutPath = path.join(outDir, 'index.html')
    console.log(
      `write ${chalk.green(path.relative(process.cwd(), indexOutPath))}`
    )
    await fs.writeFile(indexOutPath, generatedIndex)
    console.log(`done in ${((Date.now() - start) / 1000).toFixed(2)}s.`)
  }

  return {
    output,
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
