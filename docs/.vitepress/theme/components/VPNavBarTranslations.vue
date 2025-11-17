<script lang="ts" setup>
import { computed } from 'vue'
import type { DefaultTheme } from 'vitepress/theme'

// ✅ Use official theme component paths (safe, typed)
import VPFlyout from 'vitepress/theme/components/VPFlyout.vue'
import VPMenuLink from 'vitepress/theme/components/VPMenuLink.vue'

// ✅ Public VitePress composables
import { useData } from 'vitepress'
import { useLangs } from 'vitepress/theme/composables/langs'
import { isExternal } from 'vitepress/shared'

const { theme } = useData()
const { localeLinks, currentLang } = useLangs({ correspondingLink: true })

const normalizedLocaleLinks = computed<DefaultTheme.NavItemWithLink[]>(() =>
  localeLinks.value.map((locale: DefaultTheme.NavItemWithLink) => ({
    ...locale,
    target: resolveTarget(locale.link),
    rel: resolveRel(locale.link),
  })),
)

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
  <VPFlyout
    v-if="normalizedLocaleLinks.length && currentLang.label"
    class="VPNavBarTranslations"
    icon="vpi-languages"
    :label="theme.langMenuLabel || 'Change language'"
  >
    <div class="items">
      <p class="title">{{ currentLang.label }}</p>

      <template v-for="locale in normalizedLocaleLinks" :key="locale.link">
        <VPMenuLink :item="locale" />
      </template>
    </div>
  </VPFlyout>
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

.title {
  padding: 0 24px 0 12px;
  line-height: 32px;
  font-size: 14px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}
</style>
