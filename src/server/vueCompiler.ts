import url from 'url'
import path from 'path'
import { promises as fs } from 'fs'
import { IncomingMessage, ServerResponse } from 'http'
import { parse, compileTemplate } from '@vue/compiler-sfc'
import { sendJS } from './utils'
import { rewrite } from './moduleRewriter'

const cache = new Map()

export async function parseSFC(filename: string, saveCache = false) {
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
  const query = parsed.query
  const filename = path.join(cwd, parsed.pathname!.slice(1))
  const [descriptor] = await parseSFC(
    filename,
    true /* save last accessed descriptor on the client */
  )
  if (!descriptor) {
    res.statusCode = 404
    return res.end()
  }
  if (!query.type) {
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
        parsed.pathname + `?type=template${query.t ? `&t=${query.t}` : ``}`
      )}`
      code += `\n__script.render = __render`
    }
    if (descriptor.style) {
      // TODO
    }
    code += `\n__script.__hmrId = ${JSON.stringify(parsed.pathname)}`
    return sendJS(res, code)
  }

  if (query.type === 'template') {
    const { code, errors } = compileTemplate({
      source: descriptor.template.content,
      filename,
      compilerOptions: {
        // TODO infer proper Vue path
        runtimeModuleName: '/__modules/vue'
      }
    })

    if (errors) {
      // TODO
    }
    return sendJS(res, code)
  }

  if (query.type === 'style') {
    // TODO
    return
  }

  // TODO custom blocks
}
