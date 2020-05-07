<template>
  <h2>TypeScript</h2>
  <p class="ts-self">{{ m }}</p>
  <p>This should be 1 -> <span class="ts-import">{{ n }}</span></p>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { n } from './testTs'

const m: string = 'from ts'

export default defineComponent({
  data() {
    return {
      n,
      m
    }
  }
})
</script>
