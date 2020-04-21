import { Middleware } from '../index'
import path from 'path'
import { promises as fs } from 'fs'
import {
  SFCDescriptor,
  SFCTemplateBlock,
  SFCStyleBlock
} from '@vue/compiler-sfc'
import { resolveCompiler } from '../vueResolver'
import hash_sum from 'hash-sum'
import { rewrite } from '../moduleRewriter'

export const vueMiddleware: Middleware = ({ cwd, app }) => {
  app.use(async (ctx, next) => {
    if (!ctx.path.endsWith('.vue')) {
      return next()
    }

    const pathname = ctx.path
    const query = ctx.query
    const filename = path.join(cwd, pathname.slice(1))
    const [descriptor] = await parseSFC(
      cwd,
      filename,
      true /* save last accessed descriptor on the client */
    )

    if (!descriptor) {
      ctx.status = 404
      return
    }

    ctx.type = 'js'

    if (!query.type) {
      ctx.body = compileSFCMain(descriptor, pathname, query.t as string)
      return
    }

    if (query.type === 'template') {
      ctx.body = compileSFCTemplate(
        cwd,
        descriptor.template!,
        filename,
        pathname,
        descriptor.styles.some((s) => s.scoped)
      )
      return
    }

    if (query.type === 'style') {
      ctx.body = compileSFCStyle(
        cwd,
        descriptor.styles[Number(query.index)],
        query.index as string,
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
  cwd: string,
  filename: string,
  saveCache = false
): Promise<[SFCDescriptor, SFCDescriptor | undefined] | []> {
  let content: string
  try {
    content = await fs.readFile(filename, 'utf-8')
  } catch (e) {
    return []
  }
  const { descriptor, errors } = resolveCompiler(cwd).parse(content, {
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

export function compileSFCMain(
  descriptor: SFCDescriptor,
  pathname: string,
  timestamp: string | undefined
): string {
  timestamp = timestamp ? `&t=${timestamp}` : ``
  // inject hmr client
  let code = `import "/__hmrClient"\n`
  if (descriptor.script) {
    code += rewrite(
      descriptor.script.content,
      true /* rewrite default export to `script` */
    )
  } else {
    code += `const __script = {}; export default __script`
  }
  let hasScoped = false
  if (descriptor.styles) {
    descriptor.styles.forEach((s, i) => {
      if (s.scoped) hasScoped = true
      code += `\nimport ${JSON.stringify(
        pathname + `?type=style&index=${i}${timestamp}`
      )}`
    })
    if (hasScoped) {
      code += `\n__script.__scopeId = "data-v-${hash_sum(pathname)}"`
    }
  }
  if (descriptor.template) {
    code += `\nimport { render as __render } from ${JSON.stringify(
      pathname + `?type=template${timestamp}`
    )}`
    code += `\n__script.render = __render`
  }
  code += `\n__script.__hmrId = ${JSON.stringify(pathname)}`
  return code
}

export function compileSFCTemplate(
  cwd: string,
  template: SFCTemplateBlock,
  filename: string,
  pathname: string,
  scoped: boolean
): string {
  const { code, errors } = resolveCompiler(cwd).compileTemplate({
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

export function compileSFCStyle(
  cwd: string,
  style: SFCStyleBlock,
  index: string,
  filename: string,
  pathname: string
): string {
  const id = hash_sum(pathname)
  const { code, errors } = resolveCompiler(cwd).compileStyle({
    source: style.content,
    filename,
    id: `data-v-${id}`,
    scoped: style.scoped != null
  })
  // TODO css modules

  if (errors) {
    // TODO
  }

  return `
const id = "vue-style-${id}-${index}"
let style = document.getElementById(id)
if (!style) {
  style = document.createElement('style')
  style.id = id
  document.head.appendChild(style)
}
style.textContent = ${JSON.stringify(code)}
  `.trim()
}
