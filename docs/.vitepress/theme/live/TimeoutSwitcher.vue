<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  at: {
    type: String,
    required: true,
  },
})

const timeoutTimestamp = computed(() => new Date(props.at).getTime())
const now = ref(0)
let intervalId

const isTimedOut = computed(() => {
  return now.value >= timeoutTimestamp.value
})

onMounted(() => {
  now.value = Date.now()
  intervalId = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (intervalId) {
    window.clearInterval(intervalId)
  }
})
</script>

<template>
  <slot v-if="isTimedOut" name="timeout" />
  <slot v-else />
</template>
