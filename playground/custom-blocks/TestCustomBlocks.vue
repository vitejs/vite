<template>
  <h2>Custom Blocks</h2>
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
  hello: "hello,vite!"
ja:
  hello: "こんにちは、vite！"
</i18n>
