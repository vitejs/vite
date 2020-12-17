<template>
  <pre>{{ time }}</pre>
  <Hmr />
  <Env />
  <Syntax />
  <Json />
  <PreProcessors />
  <CssModules />
  <Assets />
</template>

<script setup lang="ts">
import Hmr from './Hmr.vue'
import Env from './Env.vue'
import Syntax from './Syntax.vue'
import Json from './Json.vue'
import PreProcessors from './PreProcessors.vue'
import CssModules from './CssModules.vue'
import Assets from './test-assets/Assets.vue'

import { ref, onMounted } from 'vue'

const time = ref('loading...')

onMounted(() => {
  // @ts-ignore
  time.value = `loaded in ${(performance.now() - window.start).toFixed(2)}ms.`
})
</script>
