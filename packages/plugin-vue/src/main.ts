import hash from 'hash-sum'
import path from 'path'
import qs from 'querystring'
import {
  parse,
  rewriteDefault,
  SFCBlock,
  SFCDescriptor
} from '@vue/compiler-sfc'
import { ResolvedOptions } from '.'
import { getPrevDescriptor, setDescriptor } from './utils/descriptorCache'
import { PluginContext, TransformPluginContext } from 'rollup'
import { resolveScript } from './script'
import { transformTemplateInMain } from './template'
import { isOnlyTemplateChanged } from './handleHotUpdate'
import { RawSourceMap, SourceMapConsumer, SourceMapGenerator } from 'source-map'
import { createRollupError } from './utils/error'

export async function transformMain(
  code: string,
  filename: string,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
) {
  const { root, devServer, isProduction, ssr } = options

  // prev descriptor is only set and used for hmr
  const prevDescriptor = getPrevDescriptor(filename)
  const { descriptor, errors } = parse(code, {
    sourceMap: true,
    filename
  })

  // set the id on the descriptor
  const shortFilePath = path
    .relative(root, filename)
    .replace(/^(\.\.[\/\\])+/, '')
    .replace(/\\/g, '/')

  descriptor.id = hash(
    isProduction ? shortFilePath + '\n' + code : shortFilePath
  )

  setDescriptor(filename, descriptor)

  if (errors.length) {
    errors.forEach((error) =>
      pluginContext.error(createRollupError(filename, error))
    )
    return null
  }

  // feature information
  const hasScoped = descriptor.styles.some((s) => s.scoped)

  // script
  const { code: scriptCode, map } = await genScriptCode(descriptor, options)

  // template
  // Check if we can use compile template as inlined render function
  // inside <script setup>. This can only be done for build because
  // inlined template cannot be individually hot updated.
  const useInlineTemplate =
    !devServer &&
    descriptor.scriptSetup &&
    !(descriptor.template && descriptor.template.src)
  const hasTemplateImport = descriptor.template && !useInlineTemplate

  let templateCode = ''
  let templateMap
  if (hasTemplateImport) {
    ;({ code: templateCode, map: templateMap } = genTemplateCode(
      descriptor,
      options,
      pluginContext
    ))
  }

  const renderReplace = hasTemplateImport
    ? ssr
      ? `_sfc_main.ssrRender = _sfc_ssrRender`
      : `_sfc_main.render = _sfc_render`
    : ''

  // styles
  const stylesCode = genStyleCode(descriptor)

  // custom blocks
  const customBlocksCode = genCustomBlockCode(descriptor)

  const output: string[] = [
    scriptCode,
    templateCode,
    stylesCode,
    customBlocksCode,
    renderReplace
  ]
  if (hasScoped) {
    output.push(
      `_sfc_main.__scopeId = ${JSON.stringify(`data-v-${descriptor.id}`)}`
    )
  }
  if (!isProduction) {
    output.push(`_sfc_main.__file = ${JSON.stringify(shortFilePath)}`)
  } else if (devServer) {
    // expose filename during serve for devtools to pickup
    output.push(
      `_sfc_main.__file = ${JSON.stringify(path.basename(shortFilePath))}`
    )
  }
  output.push('export default _sfc_main')

  // HMR
  if (devServer) {
    // check if the template is the only thing that changed
    if (prevDescriptor && isOnlyTemplateChanged(prevDescriptor, descriptor)) {
      output.push(`export const _rerender_only = true`)
    }
    output.push(`_sfc_main.__hmrId = ${JSON.stringify(descriptor.id)}`)
    output.push(
      `__VUE_HMR_RUNTIME__.createRecord(_sfc_main.__hmrId, _sfc_main)`
    )
    output.push(
      `import.meta.hot.accept(({ default: updated, _rerender_only }) => {`,
      `  if (_rerender_only) {`,
      `    __VUE_HMR_RUNTIME__.rerender(updated.__hmrId, updated.render)`,
      `  } else {`,
      `    __VUE_HMR_RUNTIME__.reload(updated.__hmrId, updated)`,
      `  }`,
      `})`
    )
  }

  // if the template is inlined into the main module (indicated by the presence
  // of templateMap, we need to concatenate the two source maps.
  let resolvedMap = map
  if (map && templateMap) {
    const generator = SourceMapGenerator.fromSourceMap(
      new SourceMapConsumer(map)
    )
    const offset = scriptCode.match(/\r?\n/g)?.length || 1
    const templateMapConsumer = new SourceMapConsumer(templateMap)
    templateMapConsumer.eachMapping((m) => {
      generator.addMapping({
        source: m.source,
        original: { line: m.originalLine, column: m.originalColumn },
        generated: {
          line: m.generatedLine + offset,
          column: m.generatedColumn
        }
      })
    })
    resolvedMap = (generator as any).toJSON()
    // if this is a template only update, we will be reusing a cached version
    // of the main module compile result, which has outdated sourcesContent.
    resolvedMap.sourcesContent = templateMap.sourcesContent
  }

  return {
    code: output.join('\n'),
    map: resolvedMap || {
      mappings: ''
    }
  }
}

function genTemplateCode(
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: PluginContext
) {
  const renderFnName = options.ssr ? 'ssrRender' : 'render'
  const template = descriptor.template!

  // If the template is not using pre-processor AND is not using external src,
  // compile and inline it directly in the main module. When served in vite this
  // saves an extra request per SFC which can improve load performance.
  if (!template.lang && !template.src) {
    return transformTemplateInMain(
      template.content,
      descriptor,
      options,
      pluginContext
    )
  } else {
    const src = template.src || descriptor.filename
    const srcQuery = template.src ? `&src` : ``
    const attrsQuery = attrsToQuery(template.attrs, 'js', true)
    const query = `?vue&type=template${srcQuery}${attrsQuery}`
    return {
      code: `import { ${renderFnName} as _sfc_${renderFnName} } from ${JSON.stringify(
        src + query
      )}`,
      map: undefined
    }
  }
}

async function genScriptCode(
  descriptor: SFCDescriptor,
  options: ResolvedOptions
): Promise<{
  code: string
  map: RawSourceMap
}> {
  let scriptCode = `const _sfc_main = {}`
  let map
  const script = resolveScript(descriptor, options)
  if (script) {
    // If the script is js/ts and has no external src, it can be directly placed
    // in the main module.
    if (
      (!script.lang || (script.lang === 'ts' && options.devServer)) &&
      !script.src
    ) {
      scriptCode = rewriteDefault(script.content, `_sfc_main`)
      map = script.map
      if (script.lang === 'ts') {
        const result = await options.devServer!.transformWithEsbuild(
          scriptCode,
          descriptor.filename,
          { loader: 'ts' },
          map
        )
        scriptCode = result.code
        map = result.map
      }
    } else {
      const src = script.src || descriptor.filename
      const attrsQuery = attrsToQuery(script.attrs, 'js')
      const srcQuery = script.src ? `&src` : ``
      const query = `?vue&type=script${srcQuery}${attrsQuery}`
      const scriptRequest = JSON.stringify(src + query)
      scriptCode =
        `import _sfc_main from ${scriptRequest}\n` +
        `export * from ${scriptRequest}` // support named exports
    }
  }
  return {
    code: scriptCode,
    map: map as any
  }
}

function genStyleCode(descriptor: SFCDescriptor) {
  let stylesCode = ``
  let hasCSSModules = false
  if (descriptor.styles.length) {
    descriptor.styles.forEach((style, i) => {
      const src = style.src || descriptor.filename
      // do not include module in default query, since we use it to indicate
      // that the module needs to export the modules json
      const attrsQuery = attrsToQuery(style.attrs, 'css')
      const srcQuery = style.src ? `&src` : ``
      const query = `?vue&type=style&index=${i}${srcQuery}`
      const styleRequest = src + query + attrsQuery
      if (style.module) {
        if (!hasCSSModules) {
          stylesCode += `\nconst cssModules = _sfc_main.__cssModules = {}`
          hasCSSModules = true
        }
        stylesCode += genCSSModulesCode(i, styleRequest, style.module)
      } else {
        stylesCode += `\nimport ${JSON.stringify(styleRequest)}`
      }
      // TODO SSR critical CSS collection
    })
  }
  return stylesCode
}

function genCustomBlockCode(descriptor: SFCDescriptor) {
  let code = ''
  descriptor.customBlocks.forEach((block, index) => {
    const src = block.src || descriptor.filename
    const attrsQuery = attrsToQuery(block.attrs, block.type)
    const srcQuery = block.src ? `&src` : ``
    const query = `?vue&type=${block.type}&index=${index}${srcQuery}${attrsQuery}`
    const request = JSON.stringify(src + query)
    code += `import block${index} from ${request}\n`
    code += `if (typeof block${index} === 'function') block${index}(_sfc_main)\n`
  })
  return code
}

function genCSSModulesCode(
  index: number,
  request: string,
  moduleName: string | boolean
): string {
  const styleVar = `style${index}`
  const exposedName = typeof moduleName === 'string' ? moduleName : '$style'
  // inject `.module` before extension so vite handles it as css module
  const moduleRequest = request.replace(/\.(\w+)$/, '.module.$1')
  return (
    `\nimport ${styleVar} from ${JSON.stringify(moduleRequest)}` +
    `\ncssModules["${exposedName}"] = ${styleVar}`
  )
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
