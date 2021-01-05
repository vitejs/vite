import { SFCBlock, SFCDescriptor } from '@vue/component-compiler-utils'
import { rewriteDefault } from '@vue/compiler-sfc'
import { vueHotReload, vueComponentNormalizer, ResolvedOptions } from './index'
import qs from 'querystring'
import { createDescriptor, setDescriptor } from './utils/descriptorCache'
import path from 'path'
import { TransformPluginContext } from 'rollup'
import { RawSourceMap } from '@vue/component-compiler-utils/dist/types'

export async function transformMain(
  code: string,
  filePath: string,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
) {
  const descriptor = createDescriptor(code, filePath, options)

  const hasFunctional =
    descriptor.template && descriptor.template.attrs.functional

  // template
  const { code: templateCode, templateRequest } = genTemplateRequest(
    filePath,
    descriptor
  )
  // script
  const scriptVar = 'script'
  const { scriptCode } = await genScriptCode(
    scriptVar,
    descriptor,
    filePath,
    options
  )
  // style
  const cssModuleVar = '__cssModules'
  const { scoped, stylesCode } = genStyleRequest(
    cssModuleVar,
    descriptor,
    filePath
  )

  let result =
    `${scriptCode}
${templateCode}
const ${cssModuleVar} = {}
${stylesCode}
/* normalize component */
import normalizer from "${vueComponentNormalizer}"
var component = normalizer(
  script,
  render,
  staticRenderFns,
  ${hasFunctional ? `true` : `false`},
  injectStyles,
  ${scoped ? JSON.stringify(descriptor.id) : `null`},
  null,
  null
)
  `.trim() + `\n`

  result += `
function injectStyles (context) {
  for(let o in ${cssModuleVar}){
    this[o] = ${cssModuleVar}[o]
  }
}\n`

  // TODO custom block
  // // Expose filename. This is used by the devtools and Vue runtime warnings.
  if (options.isProduction) {
    // Expose the file's full path in development, so that it can be opened
    // from the devtools.
    code += `\ncomponent.options.__file = ${JSON.stringify(
      path.relative(options.root, filePath).replace(/\\/g, '/')
    )}`
  }
  // else if (options.exposeFilename) {
  // 	// Libraries can opt-in to expose their components' filenames in production builds.
  // 	// For security reasons, only expose the file's basename in production.
  // 	code += `\ncomponent.options.__file = ${JSON.stringify(filePath)}`
  // }

  if (options.devServer && !options.isProduction) {
    result += genHmrCode(descriptor.id, !!hasFunctional, templateRequest)
  }

  result += `\nexport default component.exports`
  return result
}

async function genScriptCode(
  scriptVar: string,
  descriptor: SFCDescriptor,
  filename: string,
  options: ResolvedOptions
): Promise<{
  scriptCode: string
  map?: RawSourceMap
}> {
  const { script } = descriptor
  let scriptCode = `const ${scriptVar} = {}`
  if (!script) {
    return { scriptCode }
  }
  let map
  if (script) {
    // If the script is js/ts and has no external src, it can be directly placed
    // in the main module.
    if (
      (!script.lang || (script.lang === 'ts' && options.devServer)) &&
      !script.src
    ) {
      scriptCode = rewriteDefault(script.content, scriptVar)
      map = script.map
      if (script.lang === 'ts') {
        const result = await options.devServer!.transformWithEsbuild(
          scriptCode,
          filename,
          { loader: 'ts' },
          map
        )
        scriptCode = result.code
        map = result.map
      }
    } else {
      if (script.src) {
        linkSrcToDescriptor(script.src, filename, descriptor)
      }
      const src = script.src || filename
      const langFallback = (script.src && path.extname(src).slice(1)) || 'js'
      const attrsQuery = attrsToQuery(script.attrs, langFallback)
      const srcQuery = script.src ? `&src` : ``
      const query = `?vue&type=script${srcQuery}${attrsQuery}`
      const request = JSON.stringify(src + query)
      scriptCode =
        `import ${scriptVar} from ${request}\n` + `export * from ${request}` // support named exports
    }
  }
  return {
    scriptCode,
    map: map as any,
  }
}

function genTemplateRequest(filename: string, descriptor: SFCDescriptor) {
  const template = descriptor.template
  if (!template) {
    return { code: `const render, staticRenderFns` }
  }
  if (template.src) {
    linkSrcToDescriptor(template.src, filename, descriptor)
  }
  const src = template.src || filename
  const srcQuery = template.src ? `&src` : ``
  const attrsQuery = attrsToQuery(template.attrs, 'js', true)
  const query = `?vue&type=template${srcQuery}${attrsQuery}`
  const templateRequest = src + query
  return {
    code: `import { render, staticRenderFns } from '${templateRequest}'`,
    templateRequest,
  }
}

function genHmrCode(id: string, functional: boolean, templateRequest?: string) {
  return `\n/* hot reload */
import __VUE_HMR_RUNTIME__ from "${vueHotReload}"
import vue from "vue"
__VUE_HMR_RUNTIME__.install(vue)
if(__VUE_HMR_RUNTIME__.compatible){
  if (!__VUE_HMR_RUNTIME__.isRecorded('${id}')) {
    __VUE_HMR_RUNTIME__.createRecord('${id}', component.options)
  }
   import.meta.hot.accept((update) => {
      __VUE_HMR_RUNTIME__.${
        functional ? 'rerender' : 'reload'
      }('${id}', update.default)
   })
   ${
     templateRequest
       ? `import.meta.hot.accept('${templateRequest}', (update) => {
      __VUE_HMR_RUNTIME__.rerender('${id}', update)
   })`
       : ''
   }
} else {
  console.log("The hmr is not compatible.")
}`
}

function genStyleRequest(
  cssModuleVar: string,
  descriptor: SFCDescriptor,
  filename: string
) {
  let scoped: boolean = false
  let stylesCode = ''
  descriptor.styles.forEach((style, i) => {
    if (style.src) {
      linkSrcToDescriptor(style.src, filename, descriptor)
    }
    const src = style.src || filename
    const attrsQuery = attrsToQuery(style.attrs, 'css')
    const srcQuery = style.src ? `&src` : ``
    const query = `?vue&type=style&index=${i}${srcQuery}`
    const styleRequest = src + query + attrsQuery
    if (style.scoped) scoped = true
    if (style.module) {
      stylesCode += genCSSModulesCode(
        i,
        styleRequest,
        style.module,
        cssModuleVar
      )
    } else {
      stylesCode += `\nimport ${JSON.stringify(styleRequest)}`
    }
  })

  return { scoped, stylesCode }
}

function genCSSModulesCode(
  index: number,
  request: string,
  moduleName: string | boolean,
  cssModuleVar: string
): string {
  const styleVar = `__style${index}`
  const exposedName = typeof moduleName === 'string' ? moduleName : '$style'
  // inject `.module` before extension so vite handles it as css module
  const moduleRequest = request.replace(/\.(\w+)$/, '.module.$1')
  return (
    `\nimport ${styleVar} from ${JSON.stringify(moduleRequest)}` +
    `\n${cssModuleVar}["${exposedName}"] = ${styleVar}`
  )
}

/**
 * For blocks with src imports, it is important to link the imported file
 * with its owner SFC descriptor so that we can get the information about
 * the owner SFC when compiling that file in the transform phase.
 */
function linkSrcToDescriptor(
  src: string,
  filename: string,
  descriptor: SFCDescriptor
) {
  const srcFile = path.posix.resolve(path.posix.dirname(filename), src)
  setDescriptor(srcFile, descriptor)
}

// these are built-in query parameters so should be ignored
// if the user happen to add them as attrs
const ignoreList = ['id', 'index', 'src', 'type', 'lang', 'module']

function attrsToQuery(
  attrs: SFCBlock['attrs'],
  langFallback?: string,
  forceLangFallback = false
): string {
  let query = ``
  for (const name in attrs) {
    const value = attrs[name]
    if (!ignoreList.includes(name)) {
      query += `&${qs.escape(name)}${
        value ? `=${qs.escape(String(value))}` : ``
      }`
    }
  }
  if (langFallback || attrs.lang) {
    query +=
      `lang` in attrs
        ? forceLangFallback
          ? `&lang.${langFallback}`
          : `&lang.${attrs.lang}`
        : `&lang.${langFallback}`
  }
  return query
}
