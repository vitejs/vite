import path from 'path'
import { Plugin } from './server'
import {
  SFCDescriptor,
  SFCTemplateBlock,
  SFCStyleBlock,
  SFCStyleCompileResults
} from '@vue/compiler-sfc'
import { resolveCompiler } from './resolveVue'
import hash_sum from 'hash-sum'
import LRUCache from 'lru-cache'
import { hmrClientId } from './serverPluginHmr'
import resolve from 'resolve-from'
import { cachedRead } from './utils'
import { Context } from 'koa'

const debug = require('debug')('vite:sfc')
const getEtag = require('etag')

interface CacheEntry {
  descriptor?: SFCDescriptor
  template?: string
  script?: string
  styles: SFCStyleCompileResults[]
}

export const vueCache = new LRUCache<string, CacheEntry>({
  max: 65535
})

const etagCacheCheck = (ctx: Context) => {
  ctx.etag = getEtag(ctx.body)
  ctx.status = ctx.etag === ctx.get('If-None-Match') ? 304 : 200
}

export const vuePlugin: Plugin = ({ root, app, resolver }) => {
  app.use(async (ctx, next) => {
    if (!ctx.path.endsWith('.vue') && !ctx.vue) {
      return next()
    }

    const query = ctx.query
    const publicPath = ctx.path
    const filePath = resolver.requestToFile(publicPath)

    // upstream plugins could've already read the file
    const descriptor = await parseSFC(root, filePath, ctx.body)
    if (!descriptor) {
      debug(`${ctx.url} - 404`)
      ctx.status = 404
      return
    }

    if (!query.type) {
      ctx.type = 'js'
      ctx.body = compileSFCMain(descriptor, filePath, publicPath)
      return etagCacheCheck(ctx)
    }

    if (query.type === 'template') {
      ctx.type = 'js'
      ctx.body = compileSFCTemplate(
        root,
        descriptor.template!,
        filePath,
        publicPath,
        descriptor.styles.some((s) => s.scoped)
      )
      return etagCacheCheck(ctx)
    }

    if (query.type === 'style') {
      const index = Number(query.index)
      const styleBlock = descriptor.styles[index]
      const result = await compileSFCStyle(
        root,
        styleBlock,
        index,
        filePath,
        publicPath
      )
      if (query.module != null) {
        ctx.type = 'js'
        ctx.body = `export default ${JSON.stringify(result.modules)}`
      } else {
        ctx.type = 'css'
        ctx.body = result.code
      }
      return etagCacheCheck(ctx)
    }

    // TODO custom blocks
  })
}

export async function parseSFC(
  root: string,
  filename: string,
  content?: string | Buffer
): Promise<SFCDescriptor | undefined> {
  let cached = vueCache.get(filename)
  if (cached && cached.descriptor) {
    return cached.descriptor
  }

  if (!content) {
    try {
      content = await cachedRead(null, filename)
    } catch (e) {
      return
    }
  }

  if (typeof content !== 'string') {
    content = content.toString()
  }

  const { descriptor, errors } = resolveCompiler(root).parse(content, {
    filename
  })

  if (errors.length) {
    errors.forEach((e) => {
      console.error(`[vite] SFC parse error: `, e)
    })
    console.error(`source:\n`, content)
  }

  cached = cached || { styles: [] }
  cached.descriptor = descriptor
  vueCache.set(filename, cached)
  return descriptor
}

function compileSFCMain(
  descriptor: SFCDescriptor,
  filePath: string,
  publicPath: string
): string {
  let cached = vueCache.get(filePath)
  if (cached && cached.script) {
    return cached.script
  }

  // inject hmr client
  let code = `import { updateStyle } from "${hmrClientId}"\n`
  if (descriptor.script) {
    code += descriptor.script.content.replace(
      `export default`,
      'const __script ='
    )
  } else {
    code += `const __script = {}`
  }

  const id = hash_sum(publicPath)
  let hasScoped = false
  let hasCSSModules = false
  if (descriptor.styles) {
    descriptor.styles.forEach((s, i) => {
      const styleRequest = publicPath + `?type=style&index=${i}`
      if (s.scoped) hasScoped = true
      if (s.module) {
        if (!hasCSSModules) {
          code += `\nconst __cssModules = __script.__cssModules = {}`
          hasCSSModules = true
        }
        const styleVar = `__style${i}`
        const moduleName = typeof s.module === 'string' ? s.module : '$style'
        code += `\nimport ${styleVar} from ${JSON.stringify(
          styleRequest + '&module'
        )}`
        code += `\n__cssModules[${JSON.stringify(moduleName)}] = ${styleVar}`
      }
      code += `\nupdateStyle("${id}-${i}", ${JSON.stringify(styleRequest)})`
    })
    if (hasScoped) {
      code += `\n__script.__scopeId = "data-v-${id}"`
    }
  }

  if (descriptor.template) {
    code += `\nimport { render as __render } from ${JSON.stringify(
      publicPath + `?type=template`
    )}`
    code += `\n__script.render = __render`
  }
  code += `\n__script.__hmrId = ${JSON.stringify(publicPath)}`
  code += `\n__script.__file = ${JSON.stringify(filePath)}`
  code += `\nexport default __script`

  cached = cached || { styles: [] }
  cached.script = code
  vueCache.set(filePath, cached)
  return code
}

function compileSFCTemplate(
  root: string,
  template: SFCTemplateBlock,
  filePath: string,
  publicPath: string,
  scoped: boolean
): string {
  let cached = vueCache.get(filePath)
  if (cached && cached.template) {
    return cached.template
  }

  const { code, errors } = resolveCompiler(root).compileTemplate({
    source: template.content,
    filename: filePath,
    // @ts-ignore
    transformAssetUrlsBase: path.posix.dirname(publicPath),
    compilerOptions: {
      scopeId: scoped ? `data-v-${hash_sum(publicPath)}` : null,
      runtimeModuleName: '/@modules/vue'
    }
  })

  if (errors.length) {
    errors.forEach((e) => {
      console.error(`[vite] SFC template compilation error: `, e)
    })
    console.error(`source:\n`, template.content)
  }

  cached = cached || { styles: [] }
  cached.template = code
  vueCache.set(filePath, cached)
  return code
}

async function compileSFCStyle(
  root: string,
  style: SFCStyleBlock,
  index: number,
  filePath: string,
  publicPath: string
): Promise<SFCStyleCompileResults> {
  let cached = vueCache.get(filePath)
  const cachedEntry = cached && cached.styles && cached.styles[index]
  if (cachedEntry) {
    return cachedEntry
  }

  const id = hash_sum(publicPath)
  const result = await resolveCompiler(root).compileStyleAsync({
    source: style.content,
    filename: filePath,
    id: `data-v-${id}`,
    scoped: style.scoped != null,
    modules: style.module != null,
    preprocessLang: style.lang as any,
    preprocessCustomRequire: (id: string) => require(resolve(root, id))
    // TODO load postcss config if present
  })

  if (result.errors.length) {
    result.errors.forEach((e) => {
      console.error(`[vite] SFC style compilation error: `, e)
    })
    console.error(`source:\n`, style.content)
  }

  cached = cached || { styles: [] }
  cached.styles[index] = result
  vueCache.set(filePath, cached)
  return result
}
