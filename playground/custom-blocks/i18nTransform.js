const yaml = require('js-yaml')

export const i18nTransform = {
  test(id) {
    console.log('i18nTransform#test', id)
    return /blockType=i18n/.test(id)
  },
  transform(code, isImport, isBuild, path, query) {
    console.log('i18nTransform#transform', code, isImport, path, query)
    return `
    export default function i18n(Component) {
      Component.i18n = ${JSON.stringify(
        yaml.safeLoad(code.trim()),
        undefined,
        '\t'
      )}
    }`
  }
}
