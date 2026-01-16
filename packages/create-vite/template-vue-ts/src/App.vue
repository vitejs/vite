<script setup>
import HelloWorld from './components/HelloWorld.vue'
import ViteLogo from './components/ViteLogo.vue'
import vueLogo from './assets/vue.svg'
</script>

<template>
  <section id="framework-logos">
    <a
      href="https://vite.dev"
      target="_blank"
      class="logo vite"
      aria-label="Vite logo"
    >
      <ViteLogo />
    </a>
    <span>+</span>
    <a href="https://vuejs.org/" target="_blank">
      <img :src="vueLogo" class="logo vue" alt="Vue logo" height="36" />
    </a>
  </section>

  <div class="ticks"></div>

  <HelloWorld />
</template>

<style scoped>
#framework-logos {
  .logo {
    transition: filter 200ms ease;

    &.vue:hover {
      filter: drop-shadow(0 0 18px #42b883);
    }
  }
}
</style>
