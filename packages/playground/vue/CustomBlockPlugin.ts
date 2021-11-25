import { Plugin } from 'vite'

export const vueI18nPlugin: Plugin = {
  name: 'vue-i18n',
  transform(code, id) {
    if (!/vue&type=i18n/.test(id)) {
      return
    }
    if (/\.ya?ml$/.test(id)) {
      code = JSON.stringify(require('js-yaml').load(code.trim()))
    }
    return {
      code: `export default Comp => {
      Comp.i18n = ${code}
    }`,
      map: { mappings: '' }
    }
  }
}
