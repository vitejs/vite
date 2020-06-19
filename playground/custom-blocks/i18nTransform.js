const yaml = require('js-yaml')

export const i18nTransform = ({ code, query }) => {
  let resource
  if (/ya?ml/.test(query.lang)) {
    resource = yaml.safeLoad(code.trim())
  } else {
    resource = JSON.parse(code.trim())
  }
  return `
export default Comp => {
Comp.i18n = ${JSON.stringify(resource || {})}
}`.trim()
}
