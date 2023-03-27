<script setup lang="ts">
import { VPHomeSponsors } from 'vitepress/theme'
import { useSponsor } from '../composables/sponsor'

const { evanSponsorData, viteSponsorData } = useSponsor()
</script>

<template>
  <VPHomeSponsors
    v-if="viteSponsorData"
    message="Vite is free and open source, made possible by wonderful sponsors."
    action-text="Become a sponsor"
    action-link="https://github.com/sponsors/vitejs"
    :data="viteSponsorData"
  />
  <VPHomeSponsors
    v-if="evanSponsorData"
    :message="
      viteSponsorData
        ? 'Evan You\'s sponsors'
        : 'Vite is free and open source, made possible by wonderful sponsors.'
    "
    action-text="Become a sponsor"
    action-link="https://github.com/sponsors/yyx990803"
    :data="evanSponsorData"
  />
</template>

<style>
.VPHomeSponsors + .VPHomeSponsors {
  margin-top: 1.5rem !important;
  border-top: 0;
}
</style>
