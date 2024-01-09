<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { gsap } from 'gsap'

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
  label: {
    type: String,
    required: false,
    default: null,
  },
  visible: {
    type: Boolean,
    required: false,
    default: false,
  },
  labelVisible: {
    type: Boolean,
    required: false,
    default: false,
  },
  glowColor: {
    type: String,
    required: false,
    default: '#41D1FF',
  },
  dotColor: {
    type: String,
    required: false,
    default: '#b6e4fa',
  },
})

/**
 * A unique id for the path, to avoid collisions in a single SVG output.
 */
const pathId = ref(Math.random().toString(36))

/**
 * A ref for the path element in the SVG DOM.
 */
const pathElement = ref(null)

/**
 * The radius on each side of the dot, represented as a glow on the SVG path.
 */
const gradientWidth = ref(0.04)

/**
 * A scale factor for animating the gradient width.
 */
const gradientWidthScaleFactor = ref(props.visible ? 1 : 0)

/**
 * The computed data needed to animate the gradient for the line glow.
 */
const gradientData = computed(() => {
  const width = gradientWidth.value * gradientWidthScaleFactor.value
  return {
    x1: props.position - width,
    x2: props.position,
    x3: props.position + width,
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

/**
 * The radius of the dot.
 */
const dotRadius = ref(props.visible ? 4 : 0)

/**
 * Watch for changes to the visible prop and animate the glow and dot radius.
 */
watch(
  () => props.visible,
  (visible) => {
    gsap.to(gradientWidthScaleFactor, {
      duration: 0.5,
      ease: 'power2.inOut',
      value: visible ? 1 : 0,
    })
    gsap.to(dotRadius, {
      duration: 0.6,
      ease: 'power2.inOut',
      value: visible ? 4 : 0,
    })
  },
)
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
    :r="dotRadius"
    :fill="props.dotColor"
    class="glow-effect"
  />
  <text
    v-if="props.label"
    :x="dotPosition.x"
    :y="dotPosition.y + 15"
    fill="#a3a3a3"
    font-family="Inter, sans-serif"
    font-size="11px"
    font-style="normal"
    font-weight="400"
    text-anchor="middle"
    alignment-baseline="hanging"
    class="label"
    :class="{ 'label--visible': props.labelVisible }"
  >
    {{ props.label }}
  </text>
  <defs>
    <linearGradient
      :id="`glow_gradient_${pathId}`"
      x1="0%"
      x2="100%"
      gradientUnits="userSpaceOnUse"
    >
      <stop
        :offset="gradientData.x1"
        :stop-color="props.glowColor"
        stop-opacity="0"
      />
      <stop
        :offset="gradientData.x2"
        :stop-color="props.glowColor"
        stop-opacity="0.8"
      />
      <stop
        :offset="gradientData.x3"
        :stop-color="props.glowColor"
        stop-opacity="0"
      />
    </linearGradient>
  </defs>
</template>

<style scoped>
.glow-effect {
  filter: drop-shadow(0 0 6px #b3ebff);
}

.label {
  opacity: 0;
  transition: opacity 0.4s ease-in-out;
  display: none;

  @media (min-width: 1180px) {
    display: block;
  }

  &.label--visible {
    opacity: 1;
  }
}
</style>
