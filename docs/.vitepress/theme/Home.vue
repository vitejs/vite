<script setup>
import { sponsors } from '../../_data/sponsors.js'
// these components live in @voidzero-dev/vitepress-theme
import Hero from '@components/vite/Hero.vue'
import ViteFeatureGrid1 from '@components/vite/FeatureGrid1.vue'
import ViteFeatureGrid2 from '@components/vite/FeatureGrid2.vue'
import ViteFrameworks from '@components/vite/Frameworks.vue'
import ViteCommunity from '@components/vite/Community.vue'
import TrustedBy from '@components/oss/TrustedBy.vue'
import HeadingSection from '@components/oss/HeadingSection.vue'
import Sponsors from '@components/oss/Sponsors.vue'
import Spacer from '@components/shared/Spacer.vue'
import Footer from '@components/oss/Footer.vue'
</script>

<template>
  <Hero />
  <TrustedBy :logos="['openai', 'shopify', 'stripe', 'linear', 'clickup']" />
  <HeadingSection
    heading="Redefining developer experience"
    subheading="Vite makes web development enjoyable again"
  />
  <ViteFeatureGrid1 />
  <HeadingSection heading="A shared foundation to build upon" />
  <ViteFeatureGrid2 />
  <HeadingSection heading="Powering your favorite frameworks and tools" />
  <ViteFrameworks />
  <ViteCommunity />
  <Sponsors :sponsors="sponsors" />
  <Spacer />
  <Footer
    heading="Start building with Vite"
    subheading="Prepare for a development environment that can finally keep pace with the speed of your mind."
    button-text="Get Started"
    button-link="/guide/"
  />
</template>
