<script lang="ts">
// shared data across instances so we load only once
let data = $ref<SponsorData>()

const base = `https://sponsors.vuejs.org`
const dataUrl = `${base}/vite.json`
</script>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

interface Sponsor {
  url: string
  img: string
  name: string
}

interface SponsorData {
  special: Sponsor[]
  platinum: Sponsor[]
  platinum_china: Sponsor[]
  gold: Sponsor[]
  silver: Sponsor[]
  bronze: Sponsor[]
}

const { tier, placement = 'aside' } = defineProps<{
  tier: keyof SponsorData
  placement?: 'aside' | 'page' | 'landing'
}>()

let container = $ref<HTMLElement>()
let visible = $ref(false)

onMounted(async () => {
  // only render when entering view
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        visible = true
        observer.disconnect()
      }
    },
    { rootMargin: '0px 0px 300px 0px' }
  )
  observer.observe(container)
  onUnmounted(() => observer.disconnect())

  // load data
  if (!data) {
    data = await (await fetch(dataUrl)).json()
  }
})
</script>

<template>
  <div
    ref="container"
    class="sponsor-container"
    :class="[tier.startsWith('plat') ? 'platinum' : tier, placement]"
  >
    <template v-if="data && visible">
      <a
        v-for="{ url, img, name } of data[tier]"
        class="sponsor-item"
        :href="url"
        target="_blank"
        rel="sponsored noopener"
      >
        <picture v-if="img.endsWith('png')">
          <source
            type="image/avif"
            :srcset="`${base}/images/${img.replace(/\.png$/, '.avif')}`"
          />
          <img :src="`${base}/images/${img}`" :alt="name" />
        </picture>
        <img v-else :src="`${base}/images/${img}`" :alt="name" />
      </a>
    </template>
  </div>
</template>

<style scoped>
.sponsor-container {
  --max-width: 100%;
  display: flex;
  justify-content: space-evenly;
  flex-wrap: wrap;
}

.sponsor-container.platinum {
  --max-width: 260px;
}
.sponsor-container.gold {
  --max-width: 160px;
}
.sponsor-container.silver {
  --max-width: 140px;
}

.sponsor-item {
  margin: 2px 0;
  display: flex;
  align-items: center;
  border-radius: 2px;
  transition: background-color 0.2s ease;
  height: calc(var(--max-width) / 2 - 6px);
}
.sponsor-item.action {
  font-size: 11px;
  color: #999;
}
.sponsor-item img {
  width: 100%;
  max-width: calc(var(--max-width) - 30px);
  max-height: calc(var(--max-width) / 2 - 20px);
  margin: 10px 20px;
}
.special .sponsor-item {
  height: 160px;
}
.special .sponsor-item img {
  max-width: 300px;
  max-height: 150px;
}

/* aside mode (on content pages) */
.sponsor-container.platinum.aside {
  --max-width: 200px;
}
.sponsor-container.gold.aside {
  --max-width: 124px;
}
.aside .sponsor-item {
  margin: 0;
}
</style>
