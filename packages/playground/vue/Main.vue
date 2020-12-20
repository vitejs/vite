<template>
  <h1>Vue SFCs</h1>
  <pre>{{ time }}</pre>
  <Hmr />
  <Env />
  <Syntax />
  <PreProcessors />
  <CssModules />
  <Assets />
</template>

<script setup lang="ts">
import Hmr from './Hmr.vue'
import Env from './Env.vue'
import Syntax from './Syntax.vue'
import PreProcessors from './PreProcessors.vue'
import CssModules from './CssModules.vue'
import Assets from './Assets.vue'

import { ref } from 'vue'

const time = ref('loading...')

window.addEventListener('load', () => {
  setTimeout(() => {
    const [entry] = performance.getEntriesByType("navigation")
    time.value = `loaded in ${entry.duration.toFixed(2)}ms.`
  }, 0)
})
</script>
