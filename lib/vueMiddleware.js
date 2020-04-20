const fs = require('fs')
const url = require('url')
const path = require('path')
const qs = require('querystring')
const { parseSFC } = require('./parseSFC')
const { compileTemplate } = require('@vue/compiler-sfc')
const { read, sendJS } = require('./utils')
const { rewrite } = require('./moduleRewriter')

module.exports = async (req, res) => {
  const parsed = url.parse(req.url, true)
  const query = parsed.query
  const filename = path.join(process.cwd(), parsed.pathname.slice(1))
  const [descriptor] = await parseSFC(
    filename,
    true /* save last accessed descriptor on the client */
  )
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
