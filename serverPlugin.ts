import { ServerPlugin, Context } from 'vite'
import { parse, compileTemplate } from '@vue/component-compiler-utils'
import { SFCDescriptor, SFCBlock } from 'vue-template-compiler'
import * as fs from 'fs-extra'
import hash_sum from 'hash-sum'
import { transform } from './esbuildService'
import { normalizeComponentCode } from './componentNormalizer'
import { vueHotReloadCode } from './vueHotReload'
import path from 'path'
import { resolveImport } from 'vite/dist/node/server/serverPluginModuleRewrite'
import { InternalResolver } from 'vite/dist/node/resolver'
import { cleanUrl } from 'vite/dist/node/utils'
import {
  ensureMapEntry,
  importerMap,
} from 'vite/dist/node/server/serverPluginHmr'
import { srcImportMap } from 'vite/dist/node/server/serverPluginVue'
import { TemplateCompileOptions } from '@vue/component-compiler-utils/lib/compileTemplate'
import { clientPublicPath } from 'vite/dist/node/server/serverPluginClient'

const vueTemplateCompiler = require('vue-template-compiler')

const defaultExportRE = /((?:^|\n|;)\s*)export default/

export const vueComponentNormalizer = '/vite/vueComponentNormalizer'
export const vueHotReload = '/vite/vueHotReload'

let vueCompilerOptions: TemplateCompileOptions | null = null

export function setVueCompilerOptions(opts: TemplateCompileOptions) {
  vueCompilerOptions = opts
}

export const vuePlugin: ServerPlugin = ({
  root,
  app,
  resolver,
  watcher,
  config,
}) => {
  app.use(async (ctx, next) => {
    if (ctx.path === clientPublicPath) {
      await next()
      ctx.type = 'js'
      ctx.body = ctx.body.replace(
        /__VUE_HMR_RUNTIME__\.rerender\(path, (.+)\)/g,
        '__VUE_HMR_RUNTIME__.rerender(path, m)'
      )
      return
    }
    if (ctx.path === vueHotReload) {
      ctx.type = 'js'
      ctx.body = vueHotReloadCode
      return
    }

    if (ctx.path === vueComponentNormalizer) {
      ctx.type = 'js'
      ctx.body = normalizeComponentCode
      return
    }

    if (!ctx.path.endsWith('.vue') && !ctx.vue) {
      return next()
    }

    const query = ctx.query

    const publicPath = ctx.path
    let filePath = resolver.requestToFile(publicPath)
    const source = readFile(filePath)
    const descriptor = parse({
      source,
      compiler: vueTemplateCompiler,
      filename: filePath,
      sourceRoot: root,
      needMap: true,
    }) as SFCDescriptor
    if (!descriptor) {
      return
    }
    if (!query.type) {
      // rely on vite internal sfc parse....
      await next()
      ctx.type = 'js'
      ctx.body = await parseSFC(
        root,
        filePath,
        publicPath,
        descriptor,
        resolver
      )
      return
    }

    if (query.type === 'template') {
      const templateBlock = descriptor.template!
      if (templateBlock && templateBlock.src) {
        filePath = await resolveSrcImport(root, templateBlock, ctx, resolver)
      }
      ctx.type = 'js'
      ctx.body = compileSFCTemplate(templateBlock, filePath, publicPath)
      return
    }

    if (query.type === 'style') {
      return next()
    }
  })
}

function readFile(filePath: string): string {
  return fs.readFileSync(filePath).toString()
}

async function parseSFC(
  root: string,
  filePath: string,
  publicPath: string,
  descriptor: SFCDescriptor,
  resolver: InternalResolver
): Promise<string> {
  const hasFunctional =
    descriptor.template && descriptor.template.attrs.functional
  const id = hash_sum(publicPath)

  // template
  let templateImport = `var render, staticRenderFns`
  if (descriptor.template) {
    templateImport = `import { render, staticRenderFns } from "${publicPath}?type=template"`
  }

  // script
  let scriptImport = `var script = {}`
  if (descriptor.script) {
    const scriptBlock = descriptor.script
    let code = scriptBlock.content
    if (scriptBlock && scriptBlock.src) {
      const srcPath = resolveImport(root, publicPath, scriptBlock.src, resolver)
      code = readFile(resolver.requestToFile(srcPath))
    }
    if (scriptBlock.lang === 'ts') {
      code = (
        await transform(code, publicPath, {
          loader: 'ts',
        })
      ).code
    }

    // rewrite export default.
    // fast path: simple regex replacement to avoid full-blown babel parse.
    let replaced = code.replace(defaultExportRE, '$1var script =')
    // if the script somehow still contains `default export`, it probably has
    // multi-line comments or template strings. fallback to a full parse.
    // todo
    // if (defaultExportRE.test(replaced)) {
    // 	replaced = rewriteDefaultExport(code)
    // }
    scriptImport = replaced
  }

  let stylesCode = ``
  let hasScoped
  if (descriptor.styles.length) {
    descriptor.styles.forEach((s, i) => {
      const styleRequest = publicPath + `?type=style&index=${i}`
      if (s.scoped) hasScoped = true
      if (s.module) {
        const styleVar = `__style${i}`
        const moduleName = typeof s.module === 'string' ? s.module : '$style'
        stylesCode += `\nimport ${styleVar} from ${JSON.stringify(
          styleRequest + '&module'
        )}`
        stylesCode += `\n__cssModules[${JSON.stringify(
          moduleName
        )}] = ${styleVar}`
      } else {
        stylesCode += `\nimport ${JSON.stringify(styleRequest)}`
      }
    })
  }

  let code =
    `
${templateImport}
${scriptImport}
const __cssModules = {}
${stylesCode}
/* normalize component */
import normalizer from "${vueComponentNormalizer}"
var component = normalizer(
  script,
  render,
  staticRenderFns,
  ${hasFunctional ? `true` : `false`},
  injectStyles,
  ${hasScoped ? JSON.stringify(id) : `null`},
  null,
  null
)
  `.trim() + `\n`

  code += `
function injectStyles (context) {
  for(let o in __cssModules){
    this[o] = __cssModules[o]
  }
}  
  `

  // TODO custom block
  // if (needsHotReload) {
  // 	code += `\n` + genHotReloadCode(id, hasFunctional, templateRequest)
  // }

  // // Expose filename. This is used by the devtools and Vue runtime warnings.
  // if (process.env.NODE_ENV === 'production') {
  // 	// Expose the file's full path in development, so that it can be opened
  // 	// from the devtools.
  // 	code += `\ncomponent.options.__file = ${JSON.stringify(rawShortFilePath.replace(/\\/g, '/'))}`
  // } else if (options.exposeFilename) {
  // 	// Libraries can opt-in to expose their components' filenames in production builds.
  // 	// For security reasons, only expose the file's basename in production.
  // 	code += `\ncomponent.options.__file = ${JSON.stringify(filename)}`
  // }

  code += `
/* hot reload */
import __VUE_HMR_RUNTIME__ from "${vueHotReload}"
import vue from "vue"
if (import.meta.hot) {
	__VUE_HMR_RUNTIME__.install(vue)
	if(__VUE_HMR_RUNTIME__.compatible){
		 if (!__VUE_HMR_RUNTIME__.isRecorded('${publicPath}')) {
			 __VUE_HMR_RUNTIME__.createRecord('${publicPath}', component.options)
		 	 // import.meta.hot.acceptDeps("${publicPath}?type=template", (mod) => {
		 		// 	 component.options = mod.render
		 		// 	 component.options = mode.staticRenderFns
		 		// 	 __VUE_HMR_RUNTIME__.${
          hasFunctional ? 'rerender' : 'reload'
        }('${publicPath}', component.options)
		 	 // })
		 }
	} else {
			console.log("The hmr is not compatible.")
	}
}`

  code += `\nexport default component.exports`
  return code
}

function transformRequireBackToURL(code: string, base: string): string {
  return code.replace(
    /require\(("(?:[^"\\]|\\.)+"|'(?:[^'\\]|\\.)+')\)/g,
    (_, name) => {
      if (name.charAt(1) == '.' && name.charAt(2) == '/') {
        // it's relative to source file, make it absolute by prepending base path
        return name.charAt(0) + base + name.substr(2)
      }
      return name
    }
  )
}

function compileSFCTemplate(
  block: SFCBlock,
  filePath: string,
  publicPath: string
): string {
  const { tips, errors, code } = compileTemplate({
    source: block.content,
    filename: filePath,
    compiler: vueTemplateCompiler,
    transformAssetUrls: true,
    // transformAssetUrlsOptions: {
    //   base: path.posix.dirname(publicPath),
    // },
    isProduction: process.env.NODE_ENV === 'production',
    isFunctional: !!block.attrs.functional,
    optimizeSSR: false,
    prettify: false,
    ...vueCompilerOptions,
  })

  if (tips) {
    tips.forEach(console.warn)
  }

  if (errors) {
    errors.forEach(console.error)
  }

  return (
    transformRequireBackToURL(code, path.posix.dirname(publicPath)) +
    `\nexport { render, staticRenderFns }`
  )
}

async function resolveSrcImport(
  root: string,
  block: SFCBlock,
  ctx: Context,
  resolver: InternalResolver
) {
  const importer = ctx.path
  const importee = cleanUrl(resolveImport(root, importer, block.src!, resolver))
  const filePath = resolver.requestToFile(importee)
  block.content = (await ctx.read(filePath)).toString()

  ensureMapEntry(importerMap, importee).add(ctx.path)
  srcImportMap.set(filePath, ctx.url)
  return filePath
}
