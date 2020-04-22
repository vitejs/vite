import { Plugin } from '../index'
import path from 'path'
import { promises as fs } from 'fs'
import {
  SFCDescriptor,
  SFCTemplateBlock,
  SFCStyleBlock
} from '@vue/compiler-sfc'
import { resolveCompiler } from '../resolveVue'
import hash_sum from 'hash-sum'

export const vuePlugin: Plugin = ({ root, app }) => {
  app.use(async (ctx, next) => {
    if (!ctx.path.endsWith('.vue')) {
      return next()
    }

    const pathname = ctx.path
    const query = ctx.query
    const filename = path.join(root, pathname.slice(1))
    const [descriptor] = await parseSFC(
      root,
      filename,
      true /* save last accessed descriptor on the client */
    )

    if (!descriptor) {
      ctx.status = 404
      return
    }

    if (!query.type) {
      ctx.type = 'js'
      ctx.body = compileSFCMain(descriptor, pathname, query.t as string)
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
      ctx.type = 'css'
      ctx.body = compileSFCStyle(
        root,
        descriptor.styles[Number(query.index)],
        filename,
        pathname
      )
      return
    }

    // TODO custom blocks
  })
}

const parseCache = new Map()

export async function parseSFC(
  root: string,
  filename: string,
  saveCache = false
): Promise<[SFCDescriptor, SFCDescriptor | undefined] | []> {
  let content: string
  try {
    content = await fs.readFile(filename, 'utf-8')
  } catch (e) {
    return []
  }
  const { descriptor, errors } = resolveCompiler(root).parse(content, {
    filename
  })

  if (errors) {
    // TODO
  }

  const prev = parseCache.get(filename)
  if (saveCache) {
    parseCache.set(filename, descriptor)
  }
  return [descriptor, prev]
}

function compileSFCMain(
  descriptor: SFCDescriptor,
  pathname: string,
  timestamp: string | undefined
): string {
  timestamp = timestamp ? `&t=${timestamp}` : ``
  // inject hmr client
  let code = `import { updateStyle } from "/__hmrClient"\n`
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
  return code
}

function compileSFCTemplate(
  root: string,
  template: SFCTemplateBlock,
  filename: string,
  pathname: string,
  scoped: boolean
): string {
  const { code, errors } = resolveCompiler(root).compileTemplate({
    source: template.content,
    filename,
    compilerOptions: {
      scopeId: scoped ? `data-v-${hash_sum(pathname)}` : null,
      runtimeModuleName: '/__modules/vue'
    }
  })

  if (errors) {
    // TODO
  }
  return code
}

function compileSFCStyle(
  root: string,
  style: SFCStyleBlock,
  filename: string,
  pathname: string
): string {
  const id = hash_sum(pathname)
  const { code, errors } = resolveCompiler(root).compileStyle({
    source: style.content,
    filename,
    id: `data-v-${id}`,
    scoped: style.scoped != null
  })
  // TODO css modules

  if (errors) {
    // TODO
  }

  return code
}
