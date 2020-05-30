<template>
  <p class="custom-block">{{ t('hello') }}</p>
</template>

<script>
import { useI18n } from './i18n'

export default {
  setup() {
    return { ...useI18n('en') }
  }
}
</script>

<i18n lang="yaml">
en:
  hello: "hello, i18n at vite!"
ja:
  hello: "vite上でこんにちは、i18n！"
</i18n>