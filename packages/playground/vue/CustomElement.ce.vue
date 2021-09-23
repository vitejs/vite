<template>
  <h2>Custom Element</h2>
  <button class="custom-element" type="button" @click="state.count++">
    {{ label }}: {{ state.count }}
  </button>
</template>

<script setup>
import { reactive, onBeforeMount } from 'vue'

defineProps({
  label: String
})

const state = reactive({ count: 0 })

onBeforeMount(() => {
  state.count = 1
})
</script>

<style scoped>
.custom-element {
  color: green;
}
</style>
