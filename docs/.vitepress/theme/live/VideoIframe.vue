<script setup>
import { computed } from 'vue'

const props = defineProps({
  at: {
    type: String,
    required: true,
  },
})

const iframeSrc = computed(() => {
  const totalLength = 39 * 60 + 15 // 39 minutes and 15 seconds
  const atTime = new Date(props.at).getTime()
  const now = Date.now()
  const elapsedSeconds = Math.max(0, Math.floor((now - atTime) / 1000))

  const params = new URLSearchParams({
    si: 'hhgR4fwkRw9zQ0yx',
    controls: '0',
    start: elapsedSeconds > totalLength ? 0 : String(elapsedSeconds),
    disablekb: '1',
    rel: '0',
    autoplay: '1',
  })

  return `https://www.youtube-nocookie.com/embed/bmWQqAKLgT4?${params.toString()}`
})
</script>

<template>
  <div class="wrapper wrapper--ticks w-full border-nickel border-t md:divide-x">
    <iframe
      width="560"
      height="315"
      class="w-full h-auto max-h-[calc(100vh-5rem-var(--vp-banner-height,0px))] aspect-video"
      :src="iframeSrc"
      title="YouTube video player"
      frameborder="0"
      allow="
        accelerometer;
        autoplay;
        clipboard-write;
        encrypted-media;
        gyroscope;
        picture-in-picture;
        web-share;
      "
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen
    />
  </div>
</template>
