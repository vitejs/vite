<script setup>
import Hero from './Hero.vue'
import Timer from './Timer.vue'
import TimeoutSwitcher from './TimeoutSwitcher.vue'
import VideoIframe from './VideoIframe.vue'
import Events from './Events.vue'
import Footer from '@components/oss/Footer.vue'
</script>

<template>
  <TimeoutSwitcher at="2026-03-19T15:00:00.000Z">
    <template #default>
      <Hero />
      <Timer at="2026-03-19T15:00:00.000Z" />
    </template>
    <template #timeout>
      <VideoIframe at="2026-03-19T15:00:00.000Z" />
    </template>
  </TimeoutSwitcher>
  <Events />
  <Footer
    heading="Start building with Vite"
    subheading="Prepare for a development environment that can finally keep pace with the speed of your mind."
    button-text="Get Started"
    button-link="/guide/"
  />
</template>
