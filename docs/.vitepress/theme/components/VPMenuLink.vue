<script lang="ts" setup generic="T extends DefaultTheme.NavItemWithLink">
import type { DefaultTheme } from 'vitepress/theme'
import { computed } from 'vue'
import { useData } from '@vp-composables/data'
import { useIcon } from '@vp-composables/icon'
import { isActive } from '@vp-support/shared-utils'
import { Icon } from '@iconify/vue'
import VPLink from './VPLink.vue'

const props = defineProps<{
  item: T
  rel?: string
}>()

const { page } = useData()

const icon = useIcon(() => props.item.icon)

const href = computed(() =>
  typeof props.item.link === 'function'
    ? props.item.link(page.value)
    : props.item.link,
)

defineOptions({ inheritAttrs: false })
</script>

<template>
  <div class="VPMenuLink">
    <VPLink
      v-bind="$attrs"
      class="flex items-center justify-between rounded-md px-3 py-2 text-sm font-heading text-primary dark:text-white text-left whitespace-nowrap hover:opacity-70 transition-opacity"
      :class="{
        active: isActive(
          page.relativePath,
          item.activeMatch || href,
          !!item.activeMatch,
        ),
      }"
      :href
      :target="item.target"
      :rel="props.rel ?? item.rel"
      :no-icon="item.noIcon"
    >
      <Icon v-if="icon" :icon="icon" class="shrink-0 mr-0.5" />
      <span v-html="item.text"></span>
    </VPLink>
  </div>
</template>

<style scoped>
.VPMenuGroup + .VPMenuLink {
  margin: 12px -12px 0;
  border-top: 1px solid var(--vp-c-divider);
  padding: 12px 12px 0;
}

.link:hover {
  color: var(--vp-c-brand-1);
  background-color: var(--vp-c-default-soft);
}

.link.active {
  color: var(--vp-c-brand-1);
}
</style>
