const yaml = require('js-yaml')

export const i18nServerPlugin = ({ root, app, server, watcher }) => {
  app.use(async (ctx, next) => {
    await next()

    const { query } = ctx
    const { type, blockType, lang } = query
    const source = ctx.body
    if (type === 'custom' && blockType === 'i18n') {
      let resource = {}
      if (/ya?ml/.test(lang)) {
        resource = yaml.safeLoad(source.trim())
      } else {
        resource = JSON.parse(source.trim())
      }
      let code = `export default function i18n(Component) {\n`
      code += `  Component.i18n = ${JSON.stringify(resource)}\n`
      code += `}`
      ctx.body = code
    }
  })
}
