<template>
  <h1>Vue SFCs</h1>
  <pre>{{ time }}</pre>
  <Hmr />
  <Syntax />
  <PreProcessors />
  <CssModules />
  <Assets />
  <CustomBlock />
</template>

<script setup lang="ts">
import Hmr from './Hmr.vue'
import Syntax from './Syntax.vue'
import PreProcessors from './PreProcessors.vue'
import CssModules from './CssModules.vue'
import Assets from './Assets.vue'
import CustomBlock from './CustomBlock.vue'

import { ref } from 'vue'

const time = ref('loading...')

window.addEventListener('load', () => {
  setTimeout(() => {
    const [entry] = performance.getEntriesByType("navigation")
    time.value = `loaded in ${entry.duration.toFixed(2)}ms.`
  }, 0)
})
</script>
