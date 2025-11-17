<script lang="ts" setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

// Available in alpha.12:
// site: { locales: { root: {label}, zh: {label, link}, ... } }
// lang: current language code (e.g. "en", "zh", "ja")
const { site, lang } = useData()

// Convert locales to array
const localeItems = computed(() => {
  const locales = site.value.locales || {}

  return Object.values(locales).map((locale: any) => {
    const url = locale.link || '/' // English has no link

    return {
      text: locale.label,
      link: url,
      target: computeTarget(url),
      rel: computeRel(url),
    }
  })
})

function isLangSubdomain(url: string) {
  try {
    const host = new URL(url, window.location.origin).hostname
    return /^[a-z]{2}\.vite\.dev$/.test(host)
  } catch {
    return false
  }
}

function isExternal(url: string) {
  try {
    const a = new URL(url, window.location.origin)
    return a.origin !== window.location.origin
  } catch {
    return false
  }
}

function computeTarget(url: string) {
  if (isLangSubdomain(url)) return '_self'
  if (isExternal(url)) return '_blank'
  return undefined
}

function computeRel(url: string) {
  if (isLangSubdomain(url)) return undefined
  if (isExternal(url)) return 'noreferrer'
  return undefined
}

// Current language label
const currentLangLabel = computed(() => {
  const locales = site.value.locales || {}
  const entry = Object.values(locales).find(
    (loc: any) =>
      loc.lang === lang.value || loc.link?.includes(`/${lang.value}`),
  )
  return entry?.label || 'English'
})

function onChange(e: Event) {
  const target = e.target as HTMLSelectElement | null
  if (target?.value) {
    window.location.href = target.value
  }
}
</script>

<template>
  <div class="VPNavBarTranslations">
    <select @change="onChange">
      <option disabled>{{ currentLangLabel }}</option>

      <option
        v-for="locale in localeItems"
        :key="locale.link"
        :value="locale.link"
      >
        {{ locale.text }}
      </option>
    </select>
  </div>
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
