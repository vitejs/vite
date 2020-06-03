import { getCurrentInstance } from 'vue'

export function useI18n(locale = 'en') {
  const instance = getCurrentInstance()
  const resources = instance.type.i18n || { en: {} }
  function t(key) {
    const res = resources[locale] || {}
    return res[key]
  }
  return { t }
}
