import url from 'url'
import path from 'path'
import { promises as fs } from 'fs'
import { IncomingMessage, ServerResponse } from 'http'
import { parse, compileTemplate, SFCDescriptor } from '@vue/compiler-sfc'
import { sendJS } from './utils'
import { rewrite } from './moduleRewriter'

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
    return compileSFCTemplate(res, descriptor, filename)
  }
  if (query.type === 'style') {
    // TODO
    return
  }
  // TODO custom blocks
}

function compileSFCMain(
  res: ServerResponse,
  descriptor: SFCDescriptor,
  pathname: string,
  timestamp: string | undefined
) {
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
  if (descriptor.template) {
    code += `\nimport { render as __render } from ${JSON.stringify(
      pathname + `?type=template${timestamp ? `&t=${timestamp}` : ``}`
    )}`
    code += `\n__script.render = __render`
  }
  if (descriptor.styles) {
    // TODO
  }
  code += `\n__script.__hmrId = ${JSON.stringify(pathname)}`
  sendJS(res, code)
}

function compileSFCTemplate(
  res: ServerResponse,
  descriptor: SFCDescriptor,
  filename: string
) {
  const { code, errors } = compileTemplate({
    source: descriptor.template!.content,
    filename,
    compilerOptions: {
      runtimeModuleName: '/__modules/vue'
    }
  })

  if (errors) {
    // TODO
  }
  sendJS(res, code)
}
