<script setup lang="ts">
import SponsorsGroup from './SponsorsGroup.vue'
import { useData } from 'vitepress'
const { frontmatter } = useData()
</script>

<template>
  <div v-if="frontmatter.sponsors !== false">
    <a
      class="sponsors-aside-text"
      href="https://github.com/sponsors/yyx990803"
      target="_blank"
      >Sponsors</a
    >
    <SponsorsGroup tier="platinum" />
    <SponsorsGroup tier="gold" />
  </div>
</template>

<style>
a.sponsors-aside-text {
  color: #999;
  display: block;
  margin: 3em 0 1em;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding-left: 2em;
}
</style>
