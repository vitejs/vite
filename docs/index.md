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
import FeatureSection from './.vitepress/theme/components/landing/feature-section/FeatureSection.vue'
import FrameworksSection from './.vitepress/theme/components/landing/frameworks-section/FrameworksSection.vue'
import CommunitySection from './.vitepress/theme/components/landing/community-section/CommunitySection.vue'
import SponsorSection from './.vitepress/theme/components/landing/sponsor-section/SponsorSection.vue'
import GetStartedSection from './.vitepress/theme/components/landing/GetStartedSection.vue'
import FeatureInstantServerStart from './.vitepress/theme/components/landing/feature-section/FeatureInstantServerStart.vue'
import FeatureHMR from './.vitepress/theme/components/landing/feature-section/FeatureHMR.vue'
import FeatureRichFeatures from './.vitepress/theme/components/landing/feature-section/FeatureRichFeatures.vue'
import FeatureOptimizedBuild from './.vitepress/theme/components/landing/feature-section/FeatureOptimizedBuild.vue'
import FeatureFlexiblePlugins from './.vitepress/theme/components/landing/feature-section/FeatureFlexiblePlugins.vue'
import FeatureTypedAPI from './.vitepress/theme/components/landing/feature-section/FeatureTypedAPI.vue'
import FeatureSSRSupport from './.vitepress/theme/components/landing/feature-section/FeatureSSRSupport.vue'
import FeatureCI from './.vitepress/theme/components/landing/feature-section/FeatureCI.vue'

import { gsap } from 'gsap'
gsap.ticker.fps(60)
</script>

<div class="VPHome">
  <Hero/>
  <FeatureSection title="Redefining developer experience" description="Experience the future of web bundling" type="blue">
    <FeatureInstantServerStart />
    <FeatureHMR />
    <FeatureRichFeatures />
    <FeatureOptimizedBuild />
  </FeatureSection>
  <FeatureSection title="A shared foundation to build upon" type="pink" style="margin-top: 160px" class="feature-section--flip">
    <FeatureFlexiblePlugins />
    <FeatureTypedAPI />
    <FeatureSSRSupport />
    <FeatureCI />
  </FeatureSection>
  <FrameworksSection />
  <CommunitySection />
  <SponsorSection />
  <GetStartedSection />
</div>
