import { Plugin } from './server'
import path from 'path'
import {
  SFCDescriptor,
  SFCTemplateBlock,
  SFCStyleBlock
} from '@vue/compiler-sfc'
import { resolveCompiler } from './resolveVue'
import hash_sum from 'hash-sum'
import { cachedRead } from './utils'
import LRUCache from 'lru-cache'
import { hmrClientPublicPath } from './serverPluginHmr'

interface CacheEntry {
  descriptor?: SFCDescriptor
  template?: string
  script?: string
  styles: string[]
}

export const vueCache = new LRUCache<string, CacheEntry>({
  max: 65535
})

export const vuePlugin: Plugin = ({ root, app }) => {
  app.use(async (ctx, next) => {
    if (!ctx.path.endsWith('.vue')) {
      return next()
    }

    const pathname = ctx.path
    const query = ctx.query
    const filename = path.join(root, pathname.slice(1))
    const descriptor = await parseSFC(root, filename)

    if (!descriptor) {
      ctx.status = 404
      return
    }

    if (!query.type) {
      ctx.type = 'js'
      ctx.body = compileSFCMain(
        descriptor,
        filename,
        pathname,
        query.t as string
      )
      return
    }

    if (query.type === 'template') {
      ctx.type = 'js'
      ctx.body = compileSFCTemplate(
        root,
        descriptor.template!,
        filename,
        pathname,
        descriptor.styles.some((s) => s.scoped)
      )
      return
    }

    if (query.type === 'style') {
      const index = Number(query.index)
      ctx.type = 'css'
      ctx.body = await compileSFCStyle(
        root,
        descriptor.styles[index],
        index,
        filename,
        pathname
      )
      return
    }

    // TODO custom blocks
  })
}

export async function parseSFC(
  root: string,
  filename: string
): Promise<SFCDescriptor | undefined> {
  let cached = vueCache.get(filename)
  if (cached && cached.descriptor) {
    return cached.descriptor
  }

  let content: string
  try {
    content = await cachedRead(filename, 'utf-8')
  } catch (e) {
    return
  }
  const { descriptor, errors } = resolveCompiler(root).parse(content, {
    filename
  })

  if (errors) {
    // TODO
  }

  cached = cached || { styles: [] }
  cached.descriptor = descriptor
  vueCache.set(filename, cached)
  return descriptor
}

function compileSFCMain(
  descriptor: SFCDescriptor,
  filename: string,
  pathname: string,
  timestamp: string | undefined
): string {
  let cached = vueCache.get(filename)
  if (cached && cached.script) {
    return cached.script
  }

  timestamp = timestamp ? `&t=${timestamp}` : ``
  // inject hmr client
  let code = `import { updateStyle } from "${hmrClientPublicPath}"\n`
  if (descriptor.script) {
    code += descriptor.script.content.replace(
      `export default`,
      'const __script ='
    )
  } else {
    code += `const __script = {}`
  }

  const id = hash_sum(pathname)
  let hasScoped = false
  if (descriptor.styles) {
    descriptor.styles.forEach((s, i) => {
      if (s.scoped) hasScoped = true
      code += `\nupdateStyle("${id}-${i}", ${JSON.stringify(
        pathname + `?type=style&index=${i}${timestamp}`
      )})`
    })
    if (hasScoped) {
      code += `\n__script.__scopeId = "data-v-${id}"`
    }
  }

  if (descriptor.template) {
    code += `\nimport { render as __render } from ${JSON.stringify(
      pathname + `?type=template${timestamp}`
    )}`
    code += `\n__script.render = __render`
  }
  code += `\n__script.__hmrId = ${JSON.stringify(pathname)}`
  code += `\nexport default __script`

  cached = cached || { styles: [] }
  cached.script = code
  vueCache.set(filename, cached)
  return code
}

function compileSFCTemplate(
  root: string,
  template: SFCTemplateBlock,
  filename: string,
  pathname: string,
  scoped: boolean
): string {
  let cached = vueCache.get(filename)
  if (cached && cached.template) {
    return cached.template
  }

  const { code, errors } = resolveCompiler(root).compileTemplate({
    source: template.content,
    filename,
    compilerOptions: {
      scopeId: scoped ? `data-v-${hash_sum(pathname)}` : null,
      runtimeModuleName: '/@modules/vue'
    }
  })

  if (errors) {
    // TODO
  }

  cached = cached || { styles: [] }
  cached.template = code
  vueCache.set(filename, cached)
  return code
}

async function compileSFCStyle(
  root: string,
  style: SFCStyleBlock,
  index: number,
  filename: string,
  pathname: string
): Promise<string> {
  let cached = vueCache.get(filename)
  if (cached && cached.styles && cached.styles[index]) {
    return cached.styles[index]
  }

  const id = hash_sum(pathname)
  const { code, errors } = await resolveCompiler(root).compileStyleAsync({
    source: style.content,
    filename,
    id: `data-v-${id}`,
    scoped: style.scoped != null,
    preprocessLang: style.lang as any
    // TODO load postcss config if present
  })

  // TODO css modules

  if (errors) {
    // TODO
  }

  cached = cached || { styles: [] }
  cached.styles[index] = code
  vueCache.set(filename, cached)
  return code
}
