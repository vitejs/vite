<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps({
  path: {
    type: String,
    required: true,
  },
  position: {
    type: Number,
    required: false,
    default: 0,
  },
})

/**
 * A unique id for the path, to avoid collisions in a single SVG output.
 */
const pathId = computed(() => `${props.path.replace(/\s/g, '')}`)

/**
 * A ref for the path element in the SVG DOM.
 */
const pathElement = ref(null)

/**
 * The computed data needed to animate the gradient for the line glow.
 */
const gradientData = computed(() => {
  return {
    x1: props.position - 0.04,
    x2: props.position,
    x3: props.position + 0.04,
  }
})

/**
 * The computed position of the dot along the path.
 */
const dotPosition = computed(() => {
  if (!pathElement.value) return { x: 0, y: 0 }
  const pathLength = pathElement.value.getTotalLength()
  return pathElement.value.getPointAtLength((1 - props.position) * pathLength)
})
</script>

<template>
  <path
    ref="pathElement"
    :d="props.path"
    :stroke="`url(#glow_gradient_${pathId})`"
    stroke-width="1.2"
  />
  <circle
    :cx="dotPosition.x"
    :cy="dotPosition.y"
    r="4"
    fill="#b6e4fa"
    class="glow-effect"
  />
  <text
    :x="dotPosition.x"
    :y="dotPosition.y + 12"
    fill="#a3a3a3"
    font-family="Inter, sans-serif"
    font-size="11px"
    font-style="normal"
    font-weight="400"
    text-anchor="middle"
    alignment-baseline="hanging"
  >
    .scss
  </text>
  <defs>
    <linearGradient
      :id="`glow_gradient_${pathId}`"
      x1="0%"
      x2="100%"
      gradientUnits="userSpaceOnUse"
    >
      <stop :offset="gradientData.x1" stop-color="#41D1FF" stop-opacity="0" />
      <stop :offset="gradientData.x2" stop-color="#41D1FF" stop-opacity="0.8" />
      <stop :offset="gradientData.x3" stop-color="#41D1FF" stop-opacity="0" />
    </linearGradient>
  </defs>
</template>

<style scoped>
.glow-effect {
  filter: drop-shadow(0 0 6px #b3ebff);
}
</style>
