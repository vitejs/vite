<script setup lang="ts">
import { computed } from 'vue'
import { VPDocAsideSponsors } from 'vitepress/theme'
import { useSponsor, voidZero } from '../composables/sponsor'

const { data } = useSponsor()

const sponsors = computed(() => {
  return [
    { size: 'small', items: [voidZero] },
    ...(data?.value.map((sponsor) => {
      return {
        size: sponsor.size === 'big' ? 'mini' : 'xmini',
        items: sponsor.items,
      }
    }) ?? []),
  ]
})
</script>

<template>
  <a
    class="viteconf"
    href="https://viteconf.org/?utm=vite-sidebar"
    target="_blank"
  >
    <img width="22" height="22" src="/viteconf.svg" alt="ViteConf Logo" />
    <span>
      <p class="extra-info">Building Together</p>
      <p class="heading">ViteConf 2025</p>
      <p class="extra-info">First time in-person!</p>
    </span>
  </a>
  <VPDocAsideSponsors v-if="data" :data="sponsors" />
</template>

<style>
.viteconf {
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
.viteconf:hover {
  border: 2px solid var(--vp-c-brand-light);
}
.viteconf img {
  transition: transform 0.5s;
  transform: scale(1.25);
}
.viteconf:hover img {
  transform: scale(1.75);
}
.viteconf .heading {
  background-image: linear-gradient(
    120deg,
    #b047ff 16%,
    var(--vp-c-brand-lighter),
    var(--vp-c-brand-lighter)
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.viteconf .extra-info {
  color: var(--vp-c-text-1);
  opacity: 0;
  font-size: 0.7rem;
  padding-left: 0.1rem;
  transition: opacity 0.5s;
}
.viteconf:hover .extra-info {
  opacity: 0.9;
}
</style>
