const yaml = require('js-yaml')

export const i18nTransform = (source, query) => {
  let resource
  if (/ya?ml/.test(query.lang)) {
    resource = yaml.safeLoad(source.trim())
  } else {
    resource = JSON.parse(source.trim())
  }
  return `
export default Comp => {
Comp.i18n = ${JSON.stringify(resource || {})}
}`.trim()
}
