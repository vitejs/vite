<script setup lang="ts">
import SvgNode from '../common/SvgNode.vue'
import { onMounted, onUnmounted, Ref, ref } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    default: 'blue',
  },
})

// Animation state
const animationPercentage: Ref<number> = ref(0)
const animationVisible: Ref<boolean> = ref(false)

// GSAP timeline for the icon above the section title
let timeline: gsap.core.Timeline | null

onMounted(() => {
  startAnimation()
})

onUnmounted(() => {
  if (timeline) {
    timeline.kill()
  }
})

/**
 * When the component scrolls into viewport, we start the animation.
 */
const startAnimation = () => {
  timeline = gsap
    .timeline({
      scrollTrigger: {
        trigger: `#feature_section_${props.type}`,
        start: 'top 80%',
        once: true,
      },
    })
    .call(
      () => {
        animationVisible.value = true
      },
      undefined,
      0,
    )
    .to(
      animationPercentage,
      {
        value: 0.55,
        duration: 2,
        ease: 'expo.out',
      },
      0,
    )
}
</script>

<template>
  <section class="feature-section" :id="`feature_section_${props.type}`">
    <!-- Section Title -->
    <div class="feature-section__title">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="70"
        height="61"
        viewBox="0 0 70 61"
        fill="none"
        style="overflow: visible"
      >
        <path
          d="M38.5 0.772461V60.5215M22.6301 60.7725V38.7905C22.6301 25.3784 17.3675 12.5156 8 3.03184M54.3699 60.7725V38.7905C54.3699 25.3784 59.6325 12.5156 69 3.03184"
          stroke="url(#linear-gradient-bg-lines)"
          stroke-width="2"
        />
        <SvgNode
          v-if="type === 'blue'"
          path="M22.6301 80.7725V38.7905C22.6301 25.3784 17.3675 12.5156 8 3.03184L-20 -20"
          :position="animationPercentage"
          :visible="animationVisible"
        />
        <SvgNode
          v-if="type === 'pink'"
          path="M54.3699 80.7725V38.7905C54.3699 25.3784 59.6325 12.5156 69 3.03184L90 -20"
          :position="animationPercentage"
          :visible="animationVisible"
          dot-color="#ce9bf4"
          glow-color="#BD34FE"
        />
        <defs>
          <linearGradient
            id="linear-gradient-bg-lines"
            x1="38.5"
            y1="0.772461"
            x2="38.5"
            y2="60.7725"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stop-color="#404040" stop-opacity="0" />
            <stop offset="0.5" stop-color="#737373" />
            <stop offset="1" stop-color="#404040" stop-opacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <h2 :style="{ '--text-color': type === 'blue' ? '#41D1FF' : '#BD34FE' }">
        {{ title }}
      </h2>
      <h3 v-if="description">{{ description }}</h3>
    </div>

    <!-- Section Grid -->
    <div class="feature-section__grid">
      <!-- Feature Cards -->
      <slot></slot>
    </div>
  </section>
</template>

<style>
.feature-section {
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  gap: 0;
  align-items: center;
  position: relative;
  z-index: 2;

  &:nth-of-type(1) {
    margin-top: -60px;

    @media (min-width: 768px) {
      margin-top: 0;
    }
  }

  &:nth-of-type(2) {
    margin-top: 160px;
  }

  svg {
    position: relative;
    margin-bottom: 15px;
    z-index: 2;
  }

  h2 {
    --text-color: #404040;
    background: radial-gradient(
      circle 300px at 30% -180%,
      var(--text-color) 0%,
      #ffffff 100%
    );
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow:
      0 0 4px rgba(255, 255, 255, 0.1),
      0 0 14px rgba(130, 168, 236, 0.2);
  }

  .feature-section__title {
    display: flex;
    flex-direction: column;
    margin: 0 auto;
    width: fit-content;
    align-items: center;
    gap: 10px;
    text-align: center;
  }

  .feature-section__grid {
    display: grid;
    grid: auto / repeat(1, 1fr);
    grid-gap: 30px;
    margin: 45px auto 0;
    width: 100%;
    padding: 0 32px;

    @media (min-width: 768px) {
      width: 1194px;
      max-width: 100%;
      grid: auto / repeat(6, 1fr);
      margin: 80px auto 0;
    }
  }

  .feature-card {
    border-radius: 12px;
    border: 1px solid rgba(38, 38, 38, 0.7);
    background: #141414;
    min-height: 350px;
    display: flex;
    justify-content: flex-start;
    align-items: flex-end;
    padding: 32px;
    position: relative;
    overflow: hidden;

    /* Extend height on smaller devices, to make room for text */
    @media (max-width: 380px) {
      padding: 24px;
    }

    .feature__meta {
      max-width: 275px;
      position: relative;
      z-index: 2;
      pointer-events: none;

      .meta__title {
        color: #fff;
        font-family: Manrope, sans-serif;
        font-size: 20px;
        font-style: normal;
        font-weight: 600;
        line-height: normal;
        letter-spacing: -0.4px;
        margin-bottom: 8px;
        cursor: default;
      }

      .meta__description {
        color: #a3a3a3;
        font-family: Inter, sans-serif;
        font-size: 16px;
        font-style: normal;
        font-weight: 400;
        line-height: 150%;
        letter-spacing: -0.32px;
        text-wrap: balance;
        cursor: default;
      }

      &.meta--center {
        margin: 0 auto;
        text-align: center;
      }
    }

    .feature__visualization {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 0;
    }

    &:nth-child(1),
    &:nth-child(4) {
      grid-column: span 1;

      @media (min-width: 768px) {
        grid-column: span 3;
      }

      @media (min-width: 1200px) {
        grid-column: span 2;
      }
    }

    &:nth-child(2),
    &:nth-child(3) {
      grid-column: span 1;

      @media (min-width: 768px) {
        grid-column: span 3;
      }

      @media (min-width: 1200px) {
        grid-column: span 4;
      }
    }
  }

  &.feature-section--flip {
    .feature-card {
      &:nth-child(2),
      &:nth-child(3) {
        grid-column: span 1;

        @media (min-width: 768px) {
          grid-column: span 3;
        }

        @media (min-width: 1200px) {
          grid-column: span 2;
        }
      }

      &:nth-child(1),
      &:nth-child(4) {
        grid-column: span 1;

        @media (min-width: 768px) {
          grid-column: span 3;
        }

        @media (min-width: 1200px) {
          grid-column: span 4;
        }
      }
    }
  }
}
</style>
