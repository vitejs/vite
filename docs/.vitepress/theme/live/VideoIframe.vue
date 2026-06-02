<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Header from '@components/oss/Header.vue'
import { useYoutubePlayer } from './useYoutubePlayer'

const props = defineProps({
  at: {
    type: String,
    required: true,
  },
})

const containerEl = ref(null)
const iframeEl = ref(null)
const isFullscreen = ref(false)
const actionsVisible = ref(false)
const playButtonEl = ref(null)
let hideActionsTimeout = null

const { player, initPlayer, togglePlayback, seekTo } =
  useYoutubePlayer(iframeEl)

const checkVideoPassed = (startAt) => {
  const totalLength = 39 * 60 + 15 // 39 minutes and 15 seconds
  const atTime = new Date(startAt).getTime()
  const now = Date.now()
  const elapsedSeconds = Math.max(0, Math.floor((now - atTime) / 1000))
  const isPassed = elapsedSeconds > totalLength
  return { isPassed, elapsedSeconds }
}

const iframeSrc = computed(() => {
  const { isPassed, elapsedSeconds } = checkVideoPassed(props.at)

  const params = new URLSearchParams({
    si: 'hhgR4fwkRw9zQ0yx',
    controls: '0',
    start: isPassed ? 0 : String(elapsedSeconds),
    disablekb: '1',
    rel: '0',
    autoplay: '1',
    enablejsapi: '1',
    origin: typeof window === 'undefined' ? '' : window.location.origin,
  })

  return `https://www.youtube-nocookie.com/embed/bmWQqAKLgT4?${params.toString()}`
})

const pausedState = ref(true)

watch(
  () => player.value.state,
  (newVal, oldVal) => {
    if (newVal === 'pause') {
      pausedState.value = true
    }
    if (newVal === 'play' && pausedState.value) {
      const { isPassed, elapsedSeconds } = checkVideoPassed(props.at)
      if (!isPassed) {
        pausedState.value = false
        seekTo(elapsedSeconds)
      }
    }
  },
)

watch(
  () => player.value.state,
  (newVal) => {
    if (newVal === 'play' || newVal === 'pause') {
      playButtonEl.value?.focus()
    }
  },
  { immediate: true },
)

const syncFullscreenState = () => {
  const container = containerEl.value
  isFullscreen.value = Boolean(
    container && document.fullscreenElement === container,
  )
}

const toggleFullscreen = () => {
  const container = containerEl.value
  if (!container) return

  if (document.fullscreenElement === container) {
    return document.exitFullscreen()
  }

  return container.requestFullscreen()
}

const clearHideActionsTimeout = () => {
  if (hideActionsTimeout) {
    clearTimeout(hideActionsTimeout)
    hideActionsTimeout = null
  }
}

const scheduleHideActions = () => {
  clearHideActionsTimeout()
  hideActionsTimeout = setTimeout(() => {
    actionsVisible.value = false
  }, 2000)
}

const showActionsOnTouch = () => {
  actionsVisible.value = true
  scheduleHideActions()
}

const showActions = () => {
  actionsVisible.value = true
  scheduleHideActions()
}

const hideActions = () => {
  clearHideActionsTimeout()
  actionsVisible.value = false
}

onMounted(() => {
  document.addEventListener('fullscreenchange', syncFullscreenState)
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncFullscreenState)
  clearHideActionsTimeout()
})
</script>

<template>
  <div
    ref="containerEl"
    class="wrapper wrapper--ticks relative w-full border-nickel border-t md:divide-x"
  >
    <Header v-if="isFullscreen" class="video-iframe-header" />
    <div
      class="relative"
      @mouseenter="showActions"
      @mousemove="showActions"
      @mouseleave="hideActions"
      @touchstart="showActionsOnTouch"
    >
      <div
        class="video-iframe-mask absolute inset-0 bg-black/50 backdrop-blur-2xl transition-opacity duration-50"
        :class="
          player.state === 'pause' ? 'opacity-100' : 'opacity-0 delay-400'
        "
        @click="togglePlayback"
      />
      <div class="absolute top-0 right-0 z-10 flex gap-2 p-4">
        <a
          href="https://discord.gg/spmbbvPb9Q"
          target="_blank"
          rel="noopener noreferrer"
          class="button block w-fit backdrop-blur transition-opacity"
          :class="
            actionsVisible || player.state !== 'play'
              ? 'opacity-100'
              : 'opacity-0 delay-100 pointer-events-none'
          "
          @focus="showActions"
        >
          Chat with us
        </a>
        <button
          type="button"
          class="button block py-1.5 px-2.25 backdrop-blur transition-opacity"
          @click="toggleFullscreen"
          :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
          :class="
            actionsVisible || player.state !== 'play'
              ? 'opacity-100'
              : 'opacity-0 delay-100 pointer-events-none'
          "
          @focus="showActions"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="block"
          >
            <g v-if="isFullscreen">
              <path d="M8 3v3a2 2 0 0 1-2 2H3" />
              <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
              <path d="M3 16h3a2 2 0 0 1 2 2v3" />
              <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
            </g>
            <g v-else>
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <rect width="10" height="8" x="7" y="8" rx="1" />
            </g>
          </svg>
        </button>
      </div>
      <button
        type="button"
        class="absolute button block left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 p-4 backdrop-blur transition"
        @click="togglePlayback"
        :aria-label="player.state === 'play' ? 'Pause video' : 'Play video'"
        :class="
          actionsVisible || player.state !== 'play'
            ? 'opacity-100'
            : 'opacity-0 delay-100 pointer-events-none'
        "
        @focus="showActions"
        ref="playButtonEl"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <g v-if="player.state === 'play'">
            <line x1="10" x2="10" y1="15" y2="9" />
            <line x1="14" x2="14" y1="15" y2="9" />
          </g>
          <path
            v-else
            d="M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z"
          />
          <circle cx="12" cy="12" r="10" />
        </svg>
      </button>
      <iframe
        ref="iframeEl"
        @load="initPlayer"
        width="560"
        height="315"
        class="w-full h-auto max-h-[calc(100vh-5rem-var(--vp-banner-height,0px))] aspect-video pointer-events-none"
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
        tabindex="-1"
      />
    </div>
  </div>
</template>

<style scoped>
.video-iframe-header :deep(.wrapper) {
  border-color: transparent !important;
}

.video-iframe-header :deep(.wrapper::before),
.video-iframe-header :deep(.wrapper::after) {
  display: none;
}

.video-iframe-mask {
  -webkit-mask-image: linear-gradient(
    to bottom,
    #000 0%,
    #000 72px,
    transparent 100px
  );
  mask-image: linear-gradient(to bottom, #000 0%, #000 72px, transparent 100px);
}
</style>
