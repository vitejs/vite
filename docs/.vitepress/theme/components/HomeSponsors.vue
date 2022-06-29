<script setup lang="ts">
import { VPHomeSponsors } from 'vitepress/theme'
import { useSponsor } from '../composables/sponsor'

const { data } = useSponsor()
</script>

<template>
  <VPHomeSponsors
    v-if="data"
    message="Vite é gratuito e open source, possível graças aos nossos fantásticos patrocinadores"
    action-text="Tornar-me um patrocinador"
    action-link="https://github.com/sponsors/yyx990803"
    :data="data"
  />
</template>
