<script setup lang="ts">
import type { DocSearchInstance, DocSearchProps } from '@docsearch/js'
import type { SidepanelInstance, SidepanelProps } from '@docsearch/sidepanel-js'
import { inBrowser, useData, useRouter } from 'vitepress'
import type { DefaultTheme } from 'vitepress/theme'
import { nextTick, onUnmounted, watch } from 'vue'
import type { DocSearchAskAi } from '@voidzero-dev/vitepress-theme/src/types/docsearch'
import {
  resolveMode,
  validateCredentials,
} from '@voidzero-dev/vitepress-theme/src/support/vitepress-default/docsearch'
import {
  resolveDocSearchNavigationTarget,
  resolveDocSearchResultUrl,
} from '../composables/docsearchResultUrl'

import '@voidzero-dev/vitepress-theme/src/styles/vitepress-default/docsearch.css'

const props = defineProps<{
  algoliaOptions: DefaultTheme.AlgoliaSearchOptions
  openRequest?: {
    target: 'search' | 'askAi' | 'toggleAskAi'
    nonce: number
  } | null
}>()

const router = useRouter()
const { site } = useData()

let cleanup = () => {}
let docsearchInstance: DocSearchInstance | undefined
let sidepanelInstance: SidepanelInstance | undefined
let openOnReady: 'search' | 'askAi' | null = null
let initializeCount = 0
let docsearchLoader: Promise<typeof import('@docsearch/js')> | undefined
let sidepanelLoader:
  | Promise<typeof import('@docsearch/sidepanel-js')>
  | undefined
let lastFocusedElement: HTMLElement | null = null
let skipEventDocsearch = false
let skipEventSidepanel = false

watch(() => props.algoliaOptions, update, { immediate: true })
onUnmounted(cleanup)

watch(
  () => props.openRequest?.nonce,
  () => {
    const req = props.openRequest
    if (!req) return
    if (req.target === 'search') {
      if (docsearchInstance?.isReady) {
        onBeforeOpen('docsearch', () => docsearchInstance?.open())
      } else {
        openOnReady = 'search'
      }
    } else if (req.target === 'toggleAskAi') {
      if (sidepanelInstance?.isOpen) {
        sidepanelInstance.close()
      } else {
        onBeforeOpen('sidepanel', () => sidepanelInstance?.open())
      }
    } else {
      if (sidepanelInstance?.isReady) {
        onBeforeOpen('sidepanel', () => sidepanelInstance?.open())
      } else if (sidepanelInstance) {
        openOnReady = 'askAi'
      } else if (docsearchInstance?.isReady) {
        onBeforeOpen('docsearch', () => docsearchInstance?.openAskAi())
      } else {
        openOnReady = 'askAi'
      }
    }
  },
  { immediate: true },
)

async function update(options: DefaultTheme.AlgoliaSearchOptions) {
  if (!inBrowser) return
  await nextTick()

  const askAi = options.askAi as DocSearchAskAi | undefined

  const { valid, ...credentials } = validateCredentials({
    appId: options.appId ?? askAi?.appId,
    apiKey: options.apiKey ?? askAi?.apiKey,
    indexName: options.indexName ?? askAi?.indexName,
  })

  if (!valid) {
    console.warn(
      '[vitepress] Algolia search cannot be initialized: missing appId/apiKey/indexName.',
    )
    return
  }

  await initialize({ ...options, ...credentials })
}

async function initialize(userOptions: DefaultTheme.AlgoliaSearchOptions) {
  const currentInitialize = ++initializeCount

  cleanup()

  const { useSidePanel } = resolveMode(userOptions)
  const askAi = userOptions.askAi as DocSearchAskAi | undefined

  const { default: docsearch } = await loadDocsearch()
  if (currentInitialize !== initializeCount) return

  if (useSidePanel && askAi?.sidePanel) {
    const { default: sidepanel } = await loadSidepanel()
    if (currentInitialize !== initializeCount) return

    sidepanelInstance = sidepanel({
      ...(askAi.sidePanel === true ? {} : askAi.sidePanel),
      container: '#vp-docsearch-sidepanel',
      indexName: askAi.indexName ?? userOptions.indexName,
      appId: askAi.appId ?? userOptions.appId,
      apiKey: askAi.apiKey ?? userOptions.apiKey,
      assistantId: askAi.assistantId,
      onOpen: focusInput,
      onClose: onClose.bind(null, 'sidepanel'),
      onReady: () => {
        if (openOnReady === 'askAi') {
          openOnReady = null
          onBeforeOpen('sidepanel', () => sidepanelInstance?.open())
        }
      },
      keyboardShortcuts: {
        'Ctrl/Cmd+I': false,
      },
    } as SidepanelProps)
  }

  const options = {
    ...userOptions,
    container: '#vp-docsearch',
    navigator: {
      navigate(item) {
        const target = resolveDocSearchNavigationTarget(
          item.itemUrl,
          location.origin,
          site.value.cleanUrls,
        )

        if (target.external) {
          window.location.assign(target.url)
        } else {
          router.go(target.url)
        }
      },
    },
    transformItems: (items) =>
      items.map((item) => ({
        ...item,
        url: resolveDocSearchResultUrl(
          item.url,
          location.origin,
          site.value.cleanUrls,
        ),
      })),
    ...(useSidePanel &&
      sidepanelInstance && {
        interceptAskAiEvent: (initialMessage) => {
          onBeforeOpen('sidepanel', () =>
            sidepanelInstance?.open(initialMessage),
          )
          return true
        },
      }),
    onOpen: focusInput,
    onClose: onClose.bind(null, 'docsearch'),
    onReady: () => {
      if (openOnReady === 'search') {
        openOnReady = null
        onBeforeOpen('docsearch', () => docsearchInstance?.open())
      } else if (openOnReady === 'askAi' && !sidepanelInstance) {
        openOnReady = null
        onBeforeOpen('docsearch', () => docsearchInstance?.openAskAi())
      }
    },
    keyboardShortcuts: {
      '/': false,
      'Ctrl/Cmd+K': false,
    },
  } as DocSearchProps

  docsearchInstance = docsearch(options)

  cleanup = () => {
    docsearchInstance?.destroy()
    sidepanelInstance?.destroy()
    docsearchInstance = undefined
    sidepanelInstance = undefined
    openOnReady = null
    lastFocusedElement = null
  }
}

function focusInput() {
  requestAnimationFrame(() => {
    const input =
      document.querySelector<HTMLInputElement>('#docsearch-input') ||
      document.querySelector<HTMLInputElement>('#docsearch-sidepanel textarea')
    input?.focus()
  })
}

function onBeforeOpen(target: 'docsearch' | 'sidepanel', cb: () => void) {
  if (target === 'docsearch') {
    if (sidepanelInstance?.isOpen) {
      skipEventSidepanel = true
      sidepanelInstance.close()
    } else if (!docsearchInstance?.isOpen) {
      if (document.activeElement instanceof HTMLElement) {
        lastFocusedElement = document.activeElement
      }
    }
  } else if (target === 'sidepanel') {
    if (docsearchInstance?.isOpen) {
      skipEventDocsearch = true
      docsearchInstance.close()
    } else if (!sidepanelInstance?.isOpen) {
      if (document.activeElement instanceof HTMLElement) {
        lastFocusedElement = document.activeElement
      }
    }
  }
  setTimeout(cb, 0)
}

function onClose(target: 'docsearch' | 'sidepanel') {
  if (target === 'docsearch') {
    if (skipEventDocsearch) {
      skipEventDocsearch = false
      return
    }
  } else if (target === 'sidepanel') {
    if (skipEventSidepanel) {
      skipEventSidepanel = false
      return
    }
  }
  if (lastFocusedElement) {
    lastFocusedElement.focus()
    lastFocusedElement = null
  }
}

function loadDocsearch() {
  if (!docsearchLoader) {
    docsearchLoader = import('@docsearch/js')
  }
  return docsearchLoader
}

function loadSidepanel() {
  if (!sidepanelLoader) {
    sidepanelLoader = import('@docsearch/sidepanel-js')
  }
  return sidepanelLoader
}
</script>

<template>
  <div id="vp-docsearch" />
  <div id="vp-docsearch-sidepanel" />
</template>
