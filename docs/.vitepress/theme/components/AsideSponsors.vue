<script setup lang="ts">
import { computed } from 'vue'
import { VPDocAsideSponsors } from 'vitepress/theme'
import { useSponsor } from '../composables/sponsor'

const { evanSponsorData, viteSponsorData } = useSponsor()

const sponsors = computed(() => {
  const viteSponsors =
    viteSponsorData?.value?.map((sponsor) => {
      return {
        size: sponsor.size === 'big' ? 'mini' : 'xmini',
        items: sponsor.items,
      }
    }) ?? []
  const evanSponsors =
    evanSponsorData?.value?.map((sponsor) => {
      return {
        size: sponsor.size === 'big' ? 'mini' : 'xmini',
        items: sponsor.items,
      }
    }) ?? []
  return [...viteSponsors, ...evanSponsors]
})
</script>

<template>
  <VPDocAsideSponsors v-if="evanSponsorData" :data="sponsors" />
</template>
