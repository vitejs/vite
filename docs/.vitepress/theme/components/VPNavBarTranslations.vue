<script lang="ts" setup>
import { useData } from 'vitepress'

// real API for alpha.12
import { useLangs } from 'vitepress/dist/client/theme-default/composables/langs.js'
import { isExternal } from 'vitepress/dist/client/shared.js'

// real existing component in alpha.12
import VPLocaleSwitch from 'vitepress/dist/client/theme-default/components/VPLocaleSwitch.vue'

const { theme } = useData()
const { localeLinks, currentLang } = useLangs({ correspondingLink: true })

function resolveTarget(url?: string) {
  if (!url) return undefined
  if (isLangSubdomain(url)) return '_self'
  if (isExternal(url)) return '_blank'
  return undefined
}

function resolveRel(url?: string) {
  if (!url) return undefined
  if (isLangSubdomain(url)) return ''
  if (isExternal(url)) return 'noreferrer'
  return undefined
}

function isLangSubdomain(url?: string) {
  return (
    typeof url === 'string' && /^https?:\/\/([a-z]{2})\.vite\.dev/i.test(url)
  )
}
</script>

<template>
  <VPLocaleSwitch
    class="VPNavBarTranslations"
    :label="theme.langMenuLabel || 'Change language'"
    :localeLinks="localeLinks"
    :currentLang="currentLang"
    :resolveTarget="resolveTarget"
    :resolveRel="resolveRel"
  />
</template>

<style scoped>
.VPNavBarTranslations {
  display: none;
}

@media (min-width: 1280px) {
  .VPNavBarTranslations {
    display: flex;
    align-items: center;
  }
}
</style>
