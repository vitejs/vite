<script setup lang="ts">
import { computed, Ref, ref, watch, ComputedRef } from 'vue'
import { gsap } from 'gsap'

/**
 * A single glowing "node" (dot) on an SVG path.
 */
export interface SvgNodeProps {
  /**
   * The SVG path to draw the node on.
   */
  path: string

  /**
   * The position of the node along the path, represented as a percentage from 0-1.
   */
  position?: number

  /**
   * Whether the node is visible or not.
   */
  visible?: boolean

  /**
   * Whether the node label is visible or not.
   */
  labelVisible?: boolean

  /**
   * The label to display next to the node.
   */
  label?: string

  /**
   * The color of the glow effect.
   */
  glowColor?: string

  /**
   * The color of the dot.
   */
  dotColor?: string | boolean
}

const props = withDefaults(defineProps<SvgNodeProps>(), {
  position: 0,
  visible: false,
  labelVisible: false,
  glowColor: '#41D1FF',
  dotColor: '#9fe6fd',
})

/**
 * A unique id for the path, to avoid collisions in a single SVG output.
 */
const pathId: Ref<string> = ref(Math.random().toString(36))

/**
 * A ref for the path element in the SVG DOM.
 */
const pathElement: Ref<SVGPathElement | null> = ref(null)

/**
 * The radius on each side of the dot, represented as a glow on the SVG path.
 */
const gradientWidth: Ref<number> = ref(30)

/**
 * A scale factor for animating the gradient width.
 */
const gradientWidthScaleFactor: Ref<number> = ref(props.visible ? 1 : 0)

/**
 * The length of the SVG path.
 */
const pathLength: ComputedRef<number> = computed(() => {
  if (!pathElement.value) return 0
  return pathElement.value.getTotalLength()
})

/**
 * The position of the dot on the SVG path.
 */
const dotPosition: Ref<{ x: number; y: number }> = ref({ x: 0, y: 0 })

/**
 * Watch for changes to the position of the dot.
 */
watch(
  () => props.position,
  () => {
    if (!pathElement.value) return { x: 0, y: 0 }
    const position = (1 - props.position) * pathLength.value
    const { x, y } = pathElement.value.getPointAtLength(position)
    dotPosition.value = { x, y }
  },
)

/**
 * The radius of the dot.
 */
const dotRadius: Ref<number> = ref(props.visible ? 3 : 0)

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
      value: visible ? 3 : 0,
    })
  },
)
</script>

<template>
  <g>
    <path
      ref="pathElement"
      :d="props.path"
      :stroke="`url(#glow_gradient_${pathId})`"
      stroke-width="1.2"
      :mask="`url(#glow_mask_${pathId})`"
      class="svg-path"
    />
    <circle
      v-if="props.dotColor"
      :cx="dotPosition.x"
      :cy="dotPosition.y"
      :r="dotRadius"
      :fill="props.dotColor ? props.dotColor : 'transparent'"
      class="circle-dot"
      :style="`--dot-color: ${props.dotColor}`"
      key="circle-dot"
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
      <mask :id="`glow_mask_${pathId}`">
        <path :d="props.path" fill="black" />
        <circle
          :cx="dotPosition.x"
          :cy="dotPosition.y"
          :r="gradientWidth * gradientWidthScaleFactor"
          fill="white"
        />
      </mask>
      <radialGradient
        :id="`glow_gradient_${pathId}`"
        :cx="dotPosition.x"
        :cy="dotPosition.y"
        :r="gradientWidth * gradientWidthScaleFactor"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" :stop-color="props.glowColor" :stop-opacity="1" />
        <stop offset="100%" :stop-color="props.glowColor" stop-opacity="0" />
      </radialGradient>
    </defs>
  </g>
</template>

<style scoped>
.svg-path {
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
}

.label {
  opacity: 0;
  transition: opacity 0.4s ease-in-out;
  display: none;
  will-change: opacity;

  @media (min-width: 1180px) {
    display: block;
  }

  &.label--visible {
    opacity: 1;
  }
}

.circle-dot {
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  --dot-color: white;

  @media (min-width: 768px) {
    filter: drop-shadow(0 0 3px var(--dot-color));
  }
}
</style>
