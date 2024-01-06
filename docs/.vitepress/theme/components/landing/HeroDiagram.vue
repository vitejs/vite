<script setup>
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { onMounted, ref } from 'vue'
import SvgGlowDot from './SvgGlowDot.vue'

gsap.registerPlugin(MotionPathPlugin)

// Input Glows
const nodeGlow1 = ref({
  x: 0,
})

onMounted(() => {
  animateLineGlow(nodeGlow1)
})

const animateLineGlow = (nodeGlow) => {
  const timeline = gsap.timeline()
  timeline.to(
    nodeGlow.value,
    {
      x: 1,
      duration: 3,
      ease: 'power1.out',
      repeat: -1,
      yoyo: true,
    },
    0,
  )
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
        stroke-width="1.2"
      />

      <!-- Line 1 Glow -->
      <SvgGlowDot
        path="M843.505 284.659L752.638 284.659C718.596 284.659 684.866 280.049 653.251 271.077L598.822 255.629L0.675021 1.00011"
        :position="nodeGlow1.x"
      />

      <!-- Line 2 -->
      <path
        ref="linePath2"
        d="M843.505 298.181L724.342 297.36C708.881 297.36 693.45 296.409 678.22 294.518L598.822 284.659C592.82 284.659 200.538 190.002 0.675028 164.892"
        stroke="url(#base_gradient)"
        stroke-width="1.2"
      />

      <!-- Line 2 Glow -->
      <SvgGlowDot
        path="M843.505 298.181L724.342 297.36C708.881 297.36 693.45 296.409 678.22 294.518L598.822 284.659C592.82 284.659 200.538 190.002 0.675028 164.892"
        :position="nodeGlow1.x"
      />

      <!-- Line 3 -->
      <path
        ref="linePath3"
        d="M843.505 311.703L701.108 310.061L598.822 305.136L0.675049 256.071"
        stroke="url(#base_gradient)"
        stroke-width="1.2"
      />

      <!-- Line 3 Glow -->
      <SvgGlowDot
        path="M843.505 311.703L701.108 310.061L598.822 305.136L0.675049 256.071"
        :position="nodeGlow1.x"
      />

      <!-- Line 4 -->
      <path
        ref="linePath4"
        d="M843.505 325.224L598.822 326.002L0.675049 321.858"
        stroke="url(#base_gradient)"
        stroke-width="1.2"
      />

      <!-- Line 4 Glow -->
      <SvgGlowDot
        path="M843.505 325.224L598.822 326.002L0.675049 321.858"
        :position="nodeGlow1.x"
      />

      <!-- Line 5 -->
      <path
        ref="linePath5"
        d="M843.505 338.746L701.108 340.388L598.822 345.442L0.675038 387.646"
        stroke="url(#base_gradient)"
        stroke-width="1.2"
      />

      <!-- Line 5 Glow -->
      <SvgGlowDot
        path="M843.505 338.746L701.108 340.388L598.822 345.442L0.675038 387.646"
        :position="nodeGlow1.x"
      />

      <!-- Line 6 -->
      <path
        ref="linePath6"
        d="M843.505 352.268L724.342 353.088C708.881 353.088 693.45 354.039 678.22 355.93L598.822 365.789L0.675067 478.825"
        stroke="url(#base_gradient)"
        stroke-width="1.2"
      />

      <!-- Line 6 Glow -->
      <SvgGlowDot
        path="M843.505 352.268L724.342 353.088C708.881 353.088 693.45 354.039 678.22 355.93L598.822 365.789L0.675067 478.825"
        :position="nodeGlow1.x"
      />

      <!-- Line 7 -->
      <path
        ref="linePath7"
        d="M843.505 365.789L752.638 365.789C718.596 365.789 684.866 370.399 653.251 379.372L598.822 394.82L0.675049 642.717"
        stroke="url(#base_gradient)"
        stroke-width="1.2"
      />

      <!-- Line 7 Glow -->
      <SvgGlowDot
        path="M843.505 365.789L752.638 365.789C718.596 365.789 684.866 370.399 653.251 379.372L598.822 394.82L0.675049 642.717"
        :position="nodeGlow1.x"
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
      </defs>
    </svg>
  </div>
</template>

<style scoped>
.hero__diagram {
  margin-top: -50px;
  pointer-events: none;
  position: relative;
  z-index: 2;
  min-height: 40vh;
}
</style>
