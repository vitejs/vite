<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  at: {
    type: String,
    required: true,
  },
})

const targetTimestamp = computed(() => new Date(props.at).getTime())

const getRemainingMs = () => Math.max(0, targetTimestamp.value - Date.now())

const remainingMs = ref(0)
let intervalId

const pad = (value) => String(value).padStart(2, '0')

const formattedCountdown = computed(() => {
  if (typeof window === 'undefined' || !remainingMs.value) return '00:00:00:00'

  const totalSeconds = Math.floor(remainingMs.value / 1000)
  const days = Math.floor(totalSeconds / (24 * 60 * 60))
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
  const seconds = totalSeconds % 60

  return `${days}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
})

onMounted(() => {
  remainingMs.value = getRemainingMs()
  intervalId = window.setInterval(() => {
    remainingMs.value = getRemainingMs()
  }, 1000)
})

onUnmounted(() => {
  if (intervalId) {
    window.clearInterval(intervalId)
  }
})
</script>

<template>
  <div
    class="wrapper wrapper--ticks grid md:grid-cols-3 w-full border-nickel border-t md:divide-x"
  >
    <div
      class="flex flex-col md:col-span-2 p-10 gap-5 justify-center text-center md:text-left"
    >
      <h2
        class="text-white text-[10vw] md:text-[min(8vw,7rem)] xxl:text-8xl font-semibold font-mono tracking-tight"
      >
        {{ formattedCountdown }}
      </h2>
    </div>
    <div class="flex items-center justify-center md:min-h-[30rem] p-10">
      <img
        src="../../../images/vite-play.webp"
        width="600"
        height="660"
        class="block max-w-[40%] md:max-w-[60%]"
        inert
        loading="lazy"
        alt=""
      />
    </div>
  </div>
</template>
