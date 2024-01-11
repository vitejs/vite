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
import FrameworksSection from './.vitepress/theme/components/landing/frameworks-section/FrameworksSection.vue'
import CommunitySection from './.vitepress/theme/components/landing/community-section/CommunitySection.vue'
import SponsorSection from './.vitepress/theme/components/landing/sponsor-section/SponsorSection.vue'
</script>

<div class="VPHome">
  <Hero/>
  <FeatureSection title="Redefining developer experience" description="Experience the future of web bundling" type="blue" />
  <FeatureSection title="A shared foundation to build upon" type="pink" style="margin-top: 160px" />
  <FrameworksSection />
  <CommunitySection />
  <SponsorSection />
</div>
