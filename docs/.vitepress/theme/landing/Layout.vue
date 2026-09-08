<script setup>
// these components live in @voidzero-dev/vitepress-theme
import Footer from '@components/oss/Footer.vue'
import HeadingSection from '@components/oss/HeadingSection.vue'
import Sponsors from '@components/oss/Sponsors.vue'
import TrustedBy from '@components/oss/TrustedBy.vue'
import Spacer from '@components/shared/Spacer.vue'
import { computed } from 'vue'
import { useSponsor } from '../composables/sponsor'
import ViteCommunity from './Community.vue'
import ViteFeatureGrid1 from './FeatureGrid1.vue'
import ViteFeatureGrid2 from './FeatureGrid2.vue'
import ViteFrameworks from './Frameworks.vue'
import Hero from './Hero.vue'

const data = useSponsor()

const sponsors = computed(
  () => data.value?.filter((s) => s.tier !== 'Brought to you by') ?? [],
)
</script>

<template>
  <Hero />
  <TrustedBy
    :logos="['openai', 'shopify', 'stripe', 'linear', 'clickup', 'wiz']"
  />
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
