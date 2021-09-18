<template>
  <h2>Custom Blocks</h2>
  <p class="custom-block">{{ t('hello') }}</p>
</template>

<script>
import { getCurrentInstance } from 'vue'

function useI18n(locale = 'en') {
  const instance = getCurrentInstance()
  const resources = instance.type.i18n || { en: {} }
  function t(key) {
    const res = resources[locale] || {}
    return res[key]
  }
  return { t }
}

// export default
export default {
  setup() {
    return { ...useI18n('ja') }
  }
}
</script>

<i18n lang="yaml">
en:
  hello: 'hello,vite!'
ja:
  hello: 'こんにちは、vite！'
</i18n>
