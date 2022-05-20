<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { VPHomeSponsors } from 'vitepress/theme'

interface Sponsors {
  special: Sponsor[]
  platinum: Sponsor[]
  platinum_china: Sponsor[]
  gold: Sponsor[]
  silver: Sponsor[]
  bronze: Sponsor[]
}

interface Sponsor {
  name: string
  img: string
  url: string
}

const data = ref()
const dataHost = 'https://sponsors.vuejs.org'
const dataUrl = `${dataHost}/vite.json`

onMounted(async () => {
  const result = await fetch(dataUrl)
  const json = await result.json()

  data.value = mapSponsors(json)
})

function mapSponsors(sponsors: Sponsors) {
  return [
    { tier: 'Platinum Sponsor', size: 'big', items: mapImgPath(sponsors['platinum']) },
    { tier: 'Gold Sponsors', size: 'medium', items: mapImgPath(sponsors['gold']) }
  ]
}

function mapImgPath(sponsors: Sponsor[]) {
  return sponsors.map((sponsor) => ({
    ...sponsor,
    img: `${dataHost}/images/${sponsor.img}`
  }))
}
</script>

<template>
  <VPHomeSponsors
    v-if="data"
    message="Vite is free and open source, made possible by wonderful sponsors."
    action-link="https://github.com/sponsors/yyx990803"
    :data="data"
  />
</template>
