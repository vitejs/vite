const fs = require('fs')
const url = require('url')
const path = require('path')
const qs = require('querystring')
const { parseSFC } = require('./parseSFC')
const { compileTemplate } = require('@vue/compiler-sfc')
const { sendJS } = require('./utils')

module.exports = (req, res) => {
  const parsed = url.parse(req.url, true)
  const query = parsed.query
  const filename = path.join(process.cwd(), parsed.pathname.slice(1))
  const [descriptor] = parseSFC(
    filename,
    true /* save last accessed descriptor on the client */
  )
  if (!query.type) {
    // inject hmr client
    let code = `import "/__hmrClient"\n`
    // TODO use more robust rewrite
    if (descriptor.script) {
      code += descriptor.script.content.replace(
        `export default`,
        'const script ='
      )
      code += `\nexport default script`
    } else {
      code += `const script = {}; export default script`
    }
    if (descriptor.template) {
      code += `\nimport { render } from ${JSON.stringify(
        parsed.pathname + `?type=template${query.t ? `&t=${query.t}` : ``}`
      )}`
      code += `\nscript.render = render`
    }
    if (descriptor.style) {
      // TODO
    }
    code += `\nscript.__hmrId = ${JSON.stringify(parsed.pathname)}`
    return sendJS(res, code)
  }

  if (query.type === 'template') {
    const { code, errors } = compileTemplate({
      source: descriptor.template.content,
      filename,
      compilerOptions: {
        // TODO infer proper Vue path
        runtimeModuleName: '/vue.js'
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
