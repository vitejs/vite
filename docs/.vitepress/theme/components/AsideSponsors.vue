<script setup lang="ts">
import { computed } from 'vue'
import { VPDocAsideSponsors } from '@voidzero-dev/vitepress-theme'
import { useSponsor, voidZero } from '../composables/sponsor'

const { data } = useSponsor()

const sponsors = computed(() => {
  return [
    { size: 'small' as const, items: [voidZero] },
    ...(data.value?.map((sponsor) => {
      return {
        size: (sponsor.size === 'big' ? 'mini' : 'xmini') as 'mini' | 'xmini',
        items: sponsor.items,
      }
    }) ?? []),
  ]
})
</script>

<template>
  <a
    class="viteconf"
    href="https://www.youtube.com/playlist?list=PLqGQbXn_GDmkJaoykvHCUmXUPjhgH2bVr"
    target="_blank"
  >
    <img
      width="22"
      height="22"
      src="../../../images/viteconf.svg"
      alt="ViteConf Logo"
    />
    <span>
      <p class="extra-info">Building Together</p>
      <p class="heading">ViteConf 2025</p>
      <p class="extra-info">View the replays</p>
    </span>
  </a>
  <VPDocAsideSponsors v-if="data" :data="sponsors" />
</template>

<style scoped>
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
.viteconf span {
  display: block;
}
.viteconf p {
  margin: 0;
  padding: 0;
  line-height: 1.1rem;
  color: var(--vp-c-text-1);
}
.viteconf .heading {
  color: var(--vp-c-brand-lighter);
}
.viteconf .extra-info {
  color: var(--vp-c-text-1);
  opacity: 1;
  font-size: 0.7rem;
  padding-left: 0.1rem;
  transition: opacity 0.5s;
}
.viteconf:hover .extra-info {
  opacity: 0.9;
}
</style>
