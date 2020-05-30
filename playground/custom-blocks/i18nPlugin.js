const yaml = require('js-yaml')

export const i18nPlugin = {
  transforms: [
    {
      test(id) {
        console.log('i18nPluing#test', id)
        return /vue\?type=i18n/.test(id)
      },
      transform(code, isImport, isBuild, path, query) {
        console.log('i18nPluing#transform', code)
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
  ]
}
