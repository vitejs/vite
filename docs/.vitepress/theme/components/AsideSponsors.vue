<script setup lang="ts">
import { computed } from 'vue'
import { VPDocAsideSponsors } from 'vitepress/theme'
import { useSponsor } from '../composables/sponsor'

const { data } = useSponsor()

const sponsors = computed(() => {
  return (
    data?.value.map((sponsor) => {
      return {
        size: sponsor.size === 'big' ? 'mini' : 'xmini',
        items: sponsor.items,
      }
    }) ?? []
  )
})
</script>

<template>
  <a class="vite-event" href="https://lu.ma/vite" target="_blank">
    <img width="22" height="22" src="/logo.svg" />
    <span>
      <p class="extra-info">May 9th, 2024</p>
      <p class="heading">Vite Meetup SF</p>
    </span>
  </a>
  <VPDocAsideSponsors v-if="data" :data="sponsors" />
</template>

<style>
.vite-event {
  margin-top: 1rem;
  margin-bottom: 1rem;
  border-radius: 14px;
  padding-top: 0.4rem;
  padding-bottom: 0.4rem;
  position: relative;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 1rem;
  background-color: var(--vp-c-bg-alt);
  border: 2px solid var(--vp-c-bg-alt);
  transition: border-color 0.5s;
}
.vite-event:hover {
  border: 2px solid var(--vp-c-brand-light);
}
.vite-event img {
  transition: transform 0.5s;
  transform: scale(1.25);
}
.vite-event:hover img {
  transform: scale(1.75);
}
.vite-event .heading {
  background-image: var(--vp-home-hero-name-background);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.vite-event .extra-info {
  color: var(--vp-c-text-1);
  font-size: 0.7rem;
  padding-left: 0.1rem;
  transition: opacity 0.5s;
}
</style>
