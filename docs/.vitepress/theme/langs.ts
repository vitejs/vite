// FIXME: remove this file and the corresponding alias in config.ts once
// @voidzero-dev/vitepress-theme is updated to use `useRoute()` instead of the
// removed `useData().hash` (removed in vitepress dcb7a755).
// Tracked: https://github.com/vuejs/vitepress/commit/dcb7a75532c5472060ec379d25a5fafbc7932637
import { computed } from 'vue'
import { useData, useRoute } from 'vitepress'

export function useLangs({ correspondingLink = false } = {}) {
  const { site, localeIndex, theme } = useData()
  const route = useRoute()
  const currentLang = computed(() => ({
    label: site.value.locales[localeIndex.value]?.label,
    link:
      site.value.locales[localeIndex.value]?.link ||
      (localeIndex.value === 'root' ? '/' : `/${localeIndex.value}/`),
  }))

  const localeLinks = computed(() =>
    Object.entries(site.value.locales).flatMap(([key, value]) =>
      currentLang.value.label === value.label
        ? []
        : {
            text: value.label,
            link:
              normalizeLink(
                value.link || (key === 'root' ? '/' : `/${key}/`),
                theme.value.i18nRouting !== false && correspondingLink,
                route.data.relativePath.slice(
                  currentLang.value.link.length - 1,
                ),
                !site.value.cleanUrls,
              ) +
              route.query +
              route.hash,
            lang: value.lang,
            dir: value.dir,
          },
    ),
  )

  return { localeLinks, currentLang }
}

function normalizeLink(
  link: string,
  addPath: boolean,
  path: string,
  addExt: boolean,
) {
  return addPath
    ? link.replace(/\/$/, '') +
        ensureStartingSlash(
          path
            .replace(/(^|\/)index\.md$/, '$1')
            .replace(/\.md$/, addExt ? '.html' : ''),
        )
    : link
}

function ensureStartingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}
