<script setup>
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { computed, onMounted, ref } from 'vue'

gsap.registerPlugin(MotionPathPlugin)

const baseStrokeWidth = ref(1.2)
const glowStrokeWidth = computed(() => baseStrokeWidth.value * 1)

// SVG Path Refs
const linePath1 = ref(null)
const linePath2 = ref(null)
const linePath3 = ref(null)
const linePath4 = ref(null)
const linePath5 = ref(null)
const linePath6 = ref(null)
const linePath7 = ref(null)

// Input Nodes
const inputNode1 = ref(null)

// Input Glows
const nodeGlow1 = ref({
  x: 0,
})

const nodeGlow1Data = computed(() => {
  return {
    x1: nodeGlow1.value.x - 0.06,
    x2: nodeGlow1.value.x,
    x3: nodeGlow1.value.x + 0.05,
  }
})

onMounted(() => {
  animateLineGlow(linePath1, inputNode1, nodeGlow1)
})

const animateLineGlow = (SVGPath, inputNode = null, nodeGlow) => {
  const timeline = gsap.timeline()

  timeline.to(
    nodeGlow.value,
    {
      x: 0.5,
      duration: 1.5,
      ease: 'power1.out',
    },
    0,
  )

  if (inputNode) {
    timeline.to(
      inputNode.value,
      {
        motionPath: {
          path: SVGPath.value,
          align: SVGPath.value,
          alignOrigin: [0.5, 0],
          start: 1,
          end: 0.5,
        },
        transformOrigin: '50% 0%',
        duration: 1.5,
        ease: 'power1.out',
      },
      '<',
    )
  }

  timeline.to(
    nodeGlow.value,
    {
      x: 1,
      duration: 1,
      ease: 'power1.in',
    },
    '>',
  )

  if (inputNode) {
    timeline.to(
      inputNode.value,
      {
        motionPath: {
          path: SVGPath.value,
          align: SVGPath.value,
          alignOrigin: [0.5, 0],
          start: 0.5,
          end: 0,
        },
        transformOrigin: '50% 0%',
        duration: 1,
        ease: 'power1.in',
      },
      '<',
    )
  }
}
</script>

<template>
  <div class="hero__diagram">
    <!-- Input Lines -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="844"
      height="644"
      viewBox="0 0 844 644"
      fill="none"
    >
      <!-- Line 1 -->
      <path
        ref="linePath1"
        d="M843.505 284.659L752.638 284.659C718.596 284.659 684.866 280.049 653.251 271.077L598.822 255.629L0.675021 1.00011"
        stroke="url(#base_gradient)"
        :stroke-width="baseStrokeWidth"
      />

      <!-- Line 1 Glow -->
      <path
        ref="linePathGlow1"
        d="M843.505 284.659L752.638 284.659C718.596 284.659 684.866 280.049 653.251 271.077L598.822 255.629L0.675021 1.00011"
        stroke="url(#glow_gradient)"
        :stroke-width="glowStrokeWidth"
      />

      <!-- Line 2 -->
      <path
        ref="linePath2"
        d="M843.505 298.181L724.342 297.36C708.881 297.36 693.45 296.409 678.22 294.518L598.822 284.659C592.82 284.659 200.538 190.002 0.675028 164.892"
        stroke="url(#base_gradient)"
        :stroke-width="baseStrokeWidth"
      />

      <!-- Line 2 Glow -->
      <path
        ref="linePathGlow2"
        d="M843.505 298.181L724.342 297.36C708.881 297.36 693.45 296.409 678.22 294.518L598.822 284.659C592.82 284.659 200.538 190.002 0.675028 164.892"
        stroke="url(#glow_gradient)"
        :stroke-width="baseStrokeWidth"
        stroke-dasharray="9999"
        stroke-dashoffset="9999"
      />

      <!-- Line 3 -->
      <path
        ref="linePath3"
        d="M843.505 311.703L701.108 310.061L598.822 305.136L0.675049 256.071"
        stroke="url(#base_gradient)"
        :stroke-width="baseStrokeWidth"
      />

      <!-- Line 3 Glow -->
      <path
        ref="linePathGlow3"
        d="M843.505 311.703L701.108 310.061L598.822 305.136L0.675049 256.071"
        stroke="url(#glow_gradient)"
        :stroke-width="baseStrokeWidth"
        stroke-dasharray="9999"
        stroke-dashoffset="9999"
      />

      <!-- Line 4 -->
      <path
        ref="linePath4"
        d="M843.505 325.224L598.822 326.002L0.675049 321.858"
        stroke="url(#base_gradient)"
        :stroke-width="baseStrokeWidth"
      />

      <!-- Line 4 Glow -->
      <path
        ref="linePathGlow4"
        d="M843.505 325.224L598.822 326.002L0.675049 321.858"
        stroke="url(#glow_gradient)"
        :stroke-width="baseStrokeWidth"
        stroke-dasharray="9999"
        stroke-dashoffset="9999"
      />

      <!-- Line 5 -->
      <path
        ref="linePath5"
        d="M843.505 338.746L701.108 340.388L598.822 345.442L0.675038 387.646"
        stroke="url(#base_gradient)"
        :stroke-width="baseStrokeWidth"
      />

      <!-- Line 5 Glow -->
      <path
        ref="linePathGlow5"
        d="M843.505 338.746L701.108 340.388L598.822 345.442L0.675038 387.646"
        stroke="url(#glow_gradient)"
        :stroke-width="baseStrokeWidth"
        stroke-dasharray="9999"
        stroke-dashoffset="9999"
      />

      <!-- Line 6 -->
      <path
        ref="linePath6"
        d="M843.505 352.268L724.342 353.088C708.881 353.088 693.45 354.039 678.22 355.93L598.822 365.789L0.675067 478.825"
        stroke="url(#base_gradient)"
        :stroke-width="baseStrokeWidth"
      />

      <!-- Line 6 Glow -->
      <path
        ref="linePathGlow6"
        d="M843.505 352.268L724.342 353.088C708.881 353.088 693.45 354.039 678.22 355.93L598.822 365.789L0.675067 478.825"
        stroke="url(#glow_gradient)"
        :stroke-width="baseStrokeWidth"
        stroke-dasharray="9999"
        stroke-dashoffset="9999"
      />

      <!-- Line 7 -->
      <path
        ref="linePath7"
        d="M843.505 365.789L752.638 365.789C718.596 365.789 684.866 370.399 653.251 379.372L598.822 394.82L0.675049 642.717"
        stroke="url(#base_gradient)"
        :stroke-width="baseStrokeWidth"
      />

      <!-- Line 7 Glow -->
      <path
        ref="linePathGlow7"
        d="M843.505 365.789L752.638 365.789C718.596 365.789 684.866 370.399 653.251 379.372L598.822 394.82L0.675049 642.717"
        stroke="url(#glow_gradient)"
        :stroke-width="baseStrokeWidth"
        stroke-dasharray="9999"
        stroke-dashoffset="9999"
      />

      <defs>
        <linearGradient
          id="base_gradient"
          x1="88.1032"
          y1="324.167"
          x2="843.505"
          y2="324.167"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="white" stop-opacity="0" />
          <stop offset="0.7" stop-color="white" stop-opacity="0.2" />
          <stop offset="1" stop-color="white" stop-opacity="0" />
        </linearGradient>

        <linearGradient
          id="glow_gradient"
          x1="0%"
          x2="100%"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            :offset="nodeGlow1Data.x1"
            stop-color="#41D1FF"
            stop-opacity="0"
          />
          <stop
            :offset="nodeGlow1Data.x2"
            stop-color="#41D1FF"
            stop-opacity="0.8"
          />
          <stop
            :offset="nodeGlow1Data.x3"
            stop-color="#41D1FF"
            stop-opacity="0"
          />
        </linearGradient>
      </defs>
    </svg>

    <!-- Input Node -->
    <div ref="inputNode1" class="node node--input">
      <span class="node__label"> .jsx </span>
    </div>
  </div>
</template>

<style scoped>
.hero__diagram {
  margin-top: -50px;
  pointer-events: none;
}

.node {
  width: 70px;
  display: flex;
  color: #a3a3a3;
  font-family: Inter, sans-serif;
  font-size: 11px;
  font-style: normal;
  font-weight: 400;
  line-height: 15px;
  align-items: center;
  text-align: center;
  flex-direction: column;
  gap: 6px;

  &:before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 100%;
    background-color: #b6e4fa;
    box-shadow: 0 0 5px 5px rgba(182, 228, 250, 0.1);
    margin-top: -4px;
  }
}

.hero__diagram {
  position: relative;
  z-index: 2;
  min-height: 40vh;
}
</style>
