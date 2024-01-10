---
title: Vite
titleTemplate: Next Generation Frontend Tooling
pageClass: landing dark

layout: home
aside: false
editLink: false
---

<script setup>
import Hero from './.vitepress/theme/components/landing/Hero.vue'
import HomeSponsors from './.vitepress/theme/components/HomeSponsors.vue'
import FeatureSection from './.vitepress/theme/components/landing/feature-section/FeatureSection.vue'
</script>

<div class="VPHome">
  <Hero/>
  <FeatureSection title="Redefining Developer Experience" description="Experience the future of web bundling" type="blue" />
  <FeatureSection title="A Shared Foundation to Build Upon" type="pink" style="margin-top: 160px" />
  <HomeSponsors/>
</div>

<style>

</style>
