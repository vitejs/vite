<script setup>
import Hero from './Hero.vue'
import Timer from './Timer.vue'
import Footer from '@components/oss/Footer.vue'
</script>

<template>
  <Hero />
  <Timer />
  <Footer
    heading="Start building with Vite"
    subheading="Prepare for a development environment that can finally keep pace with the speed of your mind."
    button-text="Get Started"
    button-link="/guide/"
  />
</template>
