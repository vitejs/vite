<script lang="ts" setup>
import { computed } from 'vue'
import { normalizeLink } from '@vp-support/utils'
import { EXTERNAL_URL_RE } from '@vp-support/shared-utils'

const props = withDefaults(
  defineProps<{
    tag?: string
    href?: string
    noIcon?: boolean
    external?: boolean
    target?: string
    rel?: string
  }>(),
  {
    external: undefined,
  },
)

const tag = computed(() => props.tag ?? (props.href ? 'a' : 'span'))
const isExternal = computed(() => {
  if (props.external !== undefined) {
    return props.external
  }
  return (
    (!!props.href && EXTERNAL_URL_RE.test(props.href)) ||
    props.target === '_blank'
  )
})
</script>

<template>
  <component
    :is="tag"
    class="VPLink"
    :class="{
      link: href,
      'vp-external-link-icon': isExternal,
      'no-icon': noIcon,
    }"
    :href="href ? normalizeLink(href) : undefined"
    :target="target ?? (isExternal ? '_blank' : undefined)"
    :rel="rel ?? (isExternal ? 'noreferrer' : undefined)"
  >
    <slot />
  </component>
</template>
