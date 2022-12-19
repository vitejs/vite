<template>
  <div>
    <h1 id="pagetitle" class="text-[rgb(11,22,33)] text-2xl">|Page title|</h1>
    <div @click="val = val + 1">{{ val }}</div>
    <div
      class="tailwind-style bg-red-100 inline-block h-24 px-8 mb-8 text-[#888888]"
    >
      {{ name }} style
    </div>
    <HelloWorld />
    <PugTemplate />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import HelloWorld from '../components/HelloWorld.vue'
import PugTemplate from '../components/PugTemplate.vue'
import { NAME } from '../utils.ts'

export default defineComponent({
  components: { HelloWorld, PugTemplate },
  setup() {
    const name = NAME
    const val = ref(0)

    return {
      name,
      val,
    }
  },
})
</script>
