import type { Plugin } from 'vite'

export const vueI18nPlugin: Plugin = {
  name: 'vue-i18n',
  async transform(code, id) {
    if (!/vue&type=i18n/.test(id)) {
      return
    }
    if (/\.ya?ml$/.test(id)) {
      const { load } = await import('js-yaml')
      code = JSON.stringify(load(code.trim()))
    }
    return {
      code: `export default Comp => {
      Comp.i18n = ${code}
    }`,
      map: { mappings: '' }
    }
  }
}
