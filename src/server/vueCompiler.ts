import url from 'url'
import path from 'path'
import { promises as fs } from 'fs'
import { IncomingMessage, ServerResponse } from 'http'
import {
  parse,
  compileTemplate,
  SFCDescriptor,
  compileStyle,
  SFCStyleBlock,
  SFCTemplateBlock
} from '@vue/compiler-sfc'
import { sendJS } from './utils'
import { rewrite } from './moduleRewriter'
import hash from 'hash-sum'

const cache = new Map()

export async function parseSFC(
  filename: string,
  saveCache = false
): Promise<[SFCDescriptor, SFCDescriptor | undefined] | []> {
  let content: string
  try {
    content = await fs.readFile(filename, 'utf-8')
  } catch (e) {
    return []
  }
  const { descriptor, errors } = parse(content, {
    filename
  })

  if (errors) {
    // TODO
  }

  const prev = cache.get(filename)
  if (saveCache) {
    cache.set(filename, descriptor)
  }
  return [descriptor, prev]
}

export async function vueMiddleware(
  cwd: string,
  req: IncomingMessage,
  res: ServerResponse
) {
  const parsed = url.parse(req.url!, true)
  const pathname = parsed.pathname!
  const query = parsed.query
  const filename = path.join(cwd, pathname.slice(1))
  const [descriptor] = await parseSFC(
    filename,
    true /* save last accessed descriptor on the client */
  )
  if (!descriptor) {
    res.statusCode = 404
    return res.end()
  }
  if (!query.type) {
    return compileSFCMain(res, descriptor, pathname, query.t as string)
  }
  if (query.type === 'template') {
    return compileSFCTemplate(
      res,
      descriptor.template!,
      filename,
      pathname,
      descriptor.styles.some((s) => s.scoped)
    )
  }
  if (query.type === 'style') {
    return compileSFCStyle(
      res,
      descriptor.styles[Number(query.index)],
      query.index as string,
      filename,
      pathname
    )
  }
  // TODO custom blocks
}

function compileSFCMain(
  res: ServerResponse,
  descriptor: SFCDescriptor,
  pathname: string,
  timestamp: string | undefined
) {
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
      code += `\n__script.__scopeId = "data-v-${hash(pathname)}"`
    }
  }
  if (descriptor.template) {
    code += `\nimport { render as __render } from ${JSON.stringify(
      pathname + `?type=template${timestamp}`
    )}`
    code += `\n__script.render = __render`
  }
  code += `\n__script.__hmrId = ${JSON.stringify(pathname)}`
  sendJS(res, code)
}

function compileSFCTemplate(
  res: ServerResponse,
  template: SFCTemplateBlock,
  filename: string,
  pathname: string,
  scoped: boolean
) {
  const { code, errors } = compileTemplate({
    source: template.content,
    filename,
    compilerOptions: {
      scopeId: scoped ? `data-v-${hash(pathname)}` : null,
      runtimeModuleName: '/__modules/vue'
    }
  })

  if (errors) {
    // TODO
  }
  sendJS(res, code)
}

function compileSFCStyle(
  res: ServerResponse,
  style: SFCStyleBlock,
  index: string,
  filename: string,
  pathname: string
) {
  const id = hash(pathname)
  const { code, errors } = compileStyle({
    source: style.content,
    filename,
    id: `data-v-${id}`,
    scoped: style.scoped != null
  })
  // TODO css modules

  if (errors) {
    // TODO
  }
  sendJS(
    res,
    `
const id = "vue-style-${id}-${index}"
let style = document.getElementById(id)
if (!style) {
  style = document.createElement('style')
  style.id = id
  document.head.appendChild(style)
}
style.textContent = ${JSON.stringify(code)}
  `.trim()
  )
}
