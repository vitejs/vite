<script setup lang="ts">
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/dist/MotionPathPlugin'
import { onMounted, onUnmounted, Ref, ref } from 'vue'
import SvgInputs from './svg-elements/SvgInputs.vue'
import SvgOutputs from './svg-elements/SvgOutputs.vue'
import SvgBlueIndicator from './svg-elements/SvgBlueIndicator.vue'
import SvgPinkIndicator from './svg-elements/SvgPinkIndicator.vue'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { SvgNodeProps } from '../common/SvgNode.vue'

gsap.registerPlugin(MotionPathPlugin)

// Define the paths on the input side of the diagram
const inputPaths = [
  'M843.505 284.659L752.638 284.659C718.596 284.659 684.866 280.049 653.251 271.077L598.822 255.629L0.675021 1.00011',
  'M843.505 298.181L724.342 297.36C708.881 297.36 693.45 296.409 678.22 294.518L598.822 284.659C592.82 284.659 200.538 190.002 0.675028 164.892',
  'M843.505 311.703L701.108 310.061L598.822 305.136L0.675049 256.071',
  'M843.505 325.224L598.822 326.002L0.675049 321.858',
  'M843.505 338.746L701.108 340.388L598.822 345.442L0.675038 387.646',
  'M843.505 352.268L724.342 353.088C708.881 353.088 693.45 354.039 678.22 355.93L598.822 365.789L0.675067 478.825',
  'M843.505 365.789L752.638 365.789C718.596 365.789 684.866 370.399 653.251 379.372L598.822 394.82L0.675049 642.717',
]

// Setup objects representing each input line's animation state
const inputLines: Ref<SvgNodeProps>[] = inputPaths.map((path) =>
  ref({
    position: 0,
    visible: false,
    labelVisible: false,
    label: '',
    dotColor: null,
    glowColor: null,
    path,
  }),
)

// Define the file set "combinations" that can be shown on the input side
const inputFileSets = ref([
  [
    { label: '.jsx' },
    { label: '.sass' },
    { label: '.svelte', color: '#ff8d67' },
  ],
  [{ label: '.tsx' }, { label: '.scss' }, { label: '.vue', color: '#40b782' }],
  [
    { label: '.js' },
    { label: '.styl' },
    { label: '.svelte', color: '#ff8d67' },
  ],
  [{ label: '.ts' }, { label: '.less' }, { label: '.vue', color: '#40b782' }],
  [{ label: '.mts' }, { label: '.html' }, { label: '.json' }],
])

// Setup objects representing each output line's animation state
const outputLines: Ref[] = [
  ref({
    position: 0,
    visible: false,
    labelVisible: false,
    label: '.html',
  }),
  ref({
    position: 0,
    visible: false,
    labelVisible: false,
    label: '.css',
  }),
  ref({
    position: 0,
    visible: false,
    labelVisible: false,
    label: '.js',
  }),
]

// Add some flags for whether to display various subcomponents
const blueIndicator = ref(false)
const pinkIndicator = ref(false)
const illuminateLogo = ref(false)

// Set up a reference to our ScrollTrigger instance and timeline
let scrollTriggerInstance: ScrollTrigger | null
let timeline: gsap.core.Timeline | null

// Start all animations when mounted
onMounted(() => {
  scrollTriggerInstance = ScrollTrigger.create({
    trigger: '#hero-diagram',
    start: 'center 100%',
    once: true,
    onEnter: () => {
      animateDiagram()
    },
  })
})

// Clean up the scroll trigger and timeline when unmounted
onUnmounted(() => {
  scrollTriggerInstance?.kill()
  timeline?.kill()
})

/**
 * The core animation for the hero diagram.
 * Has both a desktop and mobile variation.
 */
const animateDiagram = () => {
  // Determine if we're showing the desktop or mobile variation of the animation
  // This is determined on each "loop" of the animation
  const isMobile = window.innerWidth < 768

  // Prepare a timeline
  timeline = gsap.timeline({
    onComplete: animateDiagram,
  })

  // Animate the input nodes/lines
  prepareInputs().forEach((lineIndex, fileIndex) => {
    timeline.add(
      isMobile
        ? animateSingleInputMobile(inputLines[lineIndex as number])
        : animateSingleInputDesktop(inputLines[lineIndex as number]),
      fileIndex * (isMobile ? 0.4 : 0.2),
    )
  })

  // Illuminate the logo and colored indicators
  timeline.set(blueIndicator, { value: true }, isMobile ? '>-2' : '>-0.2')
  timeline.set(illuminateLogo, { value: true }, '<-0.3')
  timeline.set(pinkIndicator, { value: true }, '<+0.3')

  // Animate the output nodes/lines
  timeline.addLabel('showOutput', '<')
  outputLines.forEach((outputLine, index) => {
    timeline.add(
      isMobile
        ? animateSingleOutputMobile(outputLine)
        : animateSingleOutputDesktop(outputLine, index),
      'showOutput+=' + (isMobile ? 0.3 : 0.1) * index,
    )
  })

  //  Desktop only reset
  if (!isMobile) {
    // Disable the colored indicators
    timeline.set(blueIndicator, { value: false }, '>-1')
    timeline.set(pinkIndicator, { value: false }, '<')

    // Pause briefly at the end of the animation
    timeline.set({}, {}, '+=0.2')
  }
}

/**
 * Randomly selects a set of input file nodes and assigns them to input lines.
 */
const prepareInputs = () => {
  // Randomly select a set of input file "nodes"
  const inputFileSet =
    inputFileSets.value[Math.floor(Math.random() * inputFileSets.value.length)]

  // Choose enough unique lines for the input file nodes to slide along
  const inputLineIndexes = new Set()
  while (inputLineIndexes.size < 3) {
    const index: number = Math.floor(Math.random() * inputLines.length)
    inputLineIndexes.add(index)
  }

  // Assign each line it's appropriate node label
  const inputs = [...inputLineIndexes]
  inputs.forEach((lineIndex, fileIndex) => {
    inputLines[lineIndex as number].value.label = inputFileSet[fileIndex].label
    inputLines[lineIndex as number].value.dotColor = inputLines[
      lineIndex as number
    ].value.glowColor = inputFileSet[fileIndex].color as string | null
  })
  return inputs
}

/**
 * Animates a single output line for desktop.
 * There are technically 3 output lines, but they are stacked on top of each other.x
 */
const animateSingleOutputDesktop = (
  outputLine: Ref<SvgNodeProps>,
  index: number,
) => {
  const timeline = gsap.timeline()

  // Reset the line
  timeline.set(
    outputLine.value,
    {
      position: 0,
    },
    0,
  )

  // Animate the dot in
  timeline.to(
    outputLine.value,
    {
      position: (0.7 / 3) * (index + 1) + 0.05,
      duration: 1.5,
      ease: 'expo.out',
    },
    0,
  )

  // Show the dot
  timeline.set(
    outputLine.value,
    {
      visible: true,
    },
    0,
  )

  // Show the label
  timeline.set(
    outputLine.value,
    {
      labelVisible: true,
    },
    0.4,
  )

  // Animate the dot out
  timeline.to(
    outputLine.value,
    {
      position: 1,
      duration: 1.5,
      ease: 'power3.in',
    },
    2,
  )

  // Hide the label
  timeline.set(
    outputLine.value,
    {
      labelVisible: false,
    },
    2.5,
  )

  // Hide the dot
  timeline.set(
    outputLine.value,
    {
      visible: false,
    },
    3,
  )

  return timeline
}

/**
 * Animates a single output line for mobile.
 * There are technically 3 output lines, but they are stacked on top of each other.
 */
const animateSingleOutputMobile = (outputLine: Ref<SvgNodeProps>) => {
  const timeline = gsap.timeline()

  // Reset the line
  timeline.set(
    outputLine.value,
    {
      position: 0,
    },
    0,
  )

  // Animate the dot in
  timeline.to(
    outputLine.value,
    {
      position: 0.7,
      duration: 2,
      ease: 'power1.inOut',
    },
    0.3,
  )

  // Show the dot
  timeline.set(
    outputLine.value,
    {
      visible: true,
    },
    0.75,
  )

  // Hide the dot
  timeline.set(
    outputLine.value,
    {
      visible: false,
    },
    1.2,
  )

  return timeline
}

/**
 * Animates a single input line for desktop.
 */
const animateSingleInputDesktop = (inputLine: Ref<SvgNodeProps>) => {
  const timeline = gsap.timeline()

  // Reset the line
  timeline.set(
    inputLine.value,
    {
      position: 0,
    },
    0,
  )

  // Animate the dot in
  timeline.to(
    inputLine.value,
    {
      position: Math.random() * 0.1 + 0.4,
      duration: 1,
      ease: 'expo.out',
    },
    0,
  )

  // Show the dot
  timeline.set(
    inputLine.value,
    {
      visible: true,
    },
    0,
  )

  // Show the label
  timeline.set(
    inputLine.value,
    {
      labelVisible: true,
    },
    0.2,
  )

  // Animate the dot out
  timeline.to(
    inputLine.value,
    {
      position: 1,
      duration: 1.2,
      ease: 'power3.in',
    },
    1.2,
  )

  // Hide the label
  timeline.set(
    inputLine.value,
    {
      labelVisible: false,
    },
    1.6,
  )

  // Hide the dot
  timeline.set(
    inputLine.value,
    {
      visible: false,
    },
    1.9,
  )

  // Return the timeline
  return timeline
}

/**
 * Animates a single input line for mobile.
 */
const animateSingleInputMobile = (inputLine: Ref<SvgNodeProps>) => {
  const timeline = gsap.timeline()

  // Reset the line
  timeline.set(
    inputLine.value,
    {
      position: 0,
    },
    0,
  )

  // Animate the dot in
  timeline.to(
    inputLine.value,
    {
      position: 1,
      duration: 1.8,
      ease: 'power2.out',
    },
    0,
  )

  // Show the dot
  timeline.set(
    inputLine.value,
    {
      visible: true,
    },
    0,
  )

  // Hide the dot
  timeline.set(
    inputLine.value,
    {
      visible: false,
    },
    0.5,
  )

  // Return the timeline
  return timeline
}

// Animating borders only smoothly transitions in Chromium-based browsers
// We don't need extensive checking, just see if the `chrome` key exists on the window object
const isChromiumBrowser = ref(false)
onMounted(() => {
  isChromiumBrowser.value = 'chrome' in window
})

// Check for uwu query
const isUwu = ref(false)
onMounted(() => {
  isUwu.value = location.search.includes('?uwu')
})
</script>

<template>
  <div class="hero__diagram" id="hero-diagram">
    <!-- Input Lines -->
    <SvgInputs :input-lines="inputLines" />

    <!-- Output Line -->
    <SvgOutputs :output-lines="outputLines" />

    <!-- Blue Indicator -->
    <SvgBlueIndicator :active="blueIndicator" />

    <!-- Pink Indicator -->
    <SvgPinkIndicator :active="pinkIndicator" />

    <!-- Vite Chip -->
    <div class="vite-chip" :class="{ active: illuminateLogo }">
      <div class="vite-chip__background">
        <div class="vite-chip__border" />
        <div
          class="vite-chip__edge"
          :class="{ 'edge--animated': isChromiumBrowser }"
        ></div>
      </div>
      <div class="vite-chip__filter" />
      <img
        :src="isUwu ? '/logo-uwu.png' : '/logo.svg'"
        :alt="isUwu ? 'Vite Kawaii Logo by @icarusgkx' : 'Vite Logo'"
        class="vite-chip__logo"
        :class="{ uwu: isUwu }"
      />
    </div>
  </div>

  <!-- Background -->
  <div class="hero__background" :class="{ active: illuminateLogo }" />
</template>

<style scoped>
.hero__diagram {
  pointer-events: none;
  position: relative;
  width: 1630px;
  overflow: hidden;
  margin: -100px auto 0;

  @media (max-width: 1630px) {
    left: 50%;
    transform: translate3d(-50%, 0, 0);
  }

  @media (max-width: 768px) {
    left: 50%;
    transform: translate3d(-50%, 0, 0) scale(0.9);
  }
}

.vite-chip {
  width: 134px;
  height: 134px;
  position: absolute;
  left: 750px;
  top: 260px;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.6s ease-out;
  transform: translate3d(0, 0, 0) scale(0.85);

  .vite-chip__filter {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    transform: translate3d(0, 0, 0) scale(1);
    transition: transform 0.3s ease-in-out;
    background: linear-gradient(
        130deg,
        rgba(61, 61, 61, 0.3) 0%,
        rgba(61, 61, 61, 0) 40%
      ),
      linear-gradient(
        130deg,
        rgba(42, 33, 63, 0) 60%,
        rgba(61, 61, 61, 0.3) 100%
      ),
      linear-gradient(to bottom, rgba(16, 14, 26, 0.3) 60%, rgba(12, 12, 12, 0));
    border-radius: 10px;
    display: none;

    @media (min-width: 768px) {
      display: block;
    }

    &:after {
      content: '';
      position: absolute;
      top: -10px;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 5;
      background: linear-gradient(
        130deg,
        rgba(61, 61, 61, 0) 45%,
        rgba(154, 152, 222, 0.3) 50%,
        rgba(61, 61, 61, 0) 60%
      );
      background-size: 500%;
      background-position-x: 100%;
      filter: blur(8px);
      border-radius: 100px;
      mix-blend-mode: color-dodge;
      display: none;
    }

    &:before {
      content: '';
      position: absolute;
      top: -10px;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 5;
      background: linear-gradient(
        -130deg,
        rgba(42, 33, 63, 0) 40%,
        rgba(154, 152, 222, 0.2) 50%,
        rgba(42, 33, 63, 0) 60%
      );
      background-size: 400%;
      background-position-x: 100%;
      filter: blur(10px);
      border-radius: 100px;
      mix-blend-mode: color-dodge;
      display: none;
    }

    @media (min-width: 768px) {
      &:before,
      &:after {
        display: block;
      }
    }
  }

  .vite-chip__edge {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 2px solid;
    border-image-slice: 1;
    border-image-source: linear-gradient(
      to bottom right,
      rgba(0, 0, 0, 0) 60%,
      rgba(255, 255, 255, 0.15) 65%,
      rgba(0, 0, 0, 0) 90%
    );
    opacity: 0;
    will-change: opacity, border;
    transition: all 1s ease-in-out;

    @media (min-width: 768px) {
      border-image-source: linear-gradient(
        to bottom right,
        rgba(0, 0, 0, 0) 50%,
        rgba(255, 255, 255, 0.15) 60%,
        rgba(0, 0, 0, 0) 90%
      );
    }
  }

  .vite-chip__border {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    border-radius: 10px;
    border: 0 solid rgba(89, 82, 108, 0.3);
    opacity: 0.8;
    background: rgba(40, 40, 40, 0.3);

    @media (min-width: 768px) {
      top: 2px;
      right: 2px;
      left: 2px;
      bottom: 2px;
    }
  }

  .vite-chip__logo {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.9);
    width: 65px;
    opacity: 0.2;
    filter: grayscale(100%);
    transition: all 0.2s ease;
    z-index: 3;
  }

  .uwu.vite-chip__logo {
    width: 134px;
  }

  &.active {
    box-shadow: 0 30px 35px -10px rgba(0, 0, 0, 0.6);
    transform: translate3d(0, 0, 0) scale(1);

    .vite-chip__edge {
      opacity: 1;

      &.edge--animated {
        @media (min-width: 768px) {
          animation: rotateGradient 8s linear infinite;
        }
      }
    }

    .vite-chip__filter {
      transform: translate3d(0, 0, 0) scale(0.97);

      &:before {
        animation: shimmer 8s infinite linear;
      }

      &:after {
        animation: shimmer 6s infinite linear;
      }
    }

    .vite-chip__border {
      border-width: 5px;
      transition: all 1s ease;
    }

    .vite-chip__logo {
      opacity: 1;
      filter: grayscale(0);
      transform: translate(-50%, -50%) scale(1);
    }
  }
}

@keyframes shimmer {
  to {
    background-position-x: 0;
  }
}

.hero__background {
  position: absolute;
  top: -30%;
  left: 0;
  right: 0;
  bottom: -60%;
  width: 100%;
  z-index: -1;
  opacity: 0.4;
  transition: opacity 1s ease;

  @media (min-width: 768px) {
    opacity: 0.1;
  }

  background: url('/noise.png'),
    radial-gradient(
      circle at right center,
      rgb(86, 50, 119) 0%,
      rgba(74, 55, 140, 1) 30%,
      rgb(65, 114, 194) 55%,
      rgba(50, 81, 115, 0.5) 100%
    );
  mask-image: radial-gradient(
    ellipse 300% 30% at center center,
    rgba(0, 0, 0, 1) 20%,
    rgba(0, 0, 0, 0.5) 50%,
    rgba(0, 0, 0, 0) 100%
  );

  @media (min-width: 1024px) {
    background: url('/noise.png'),
      radial-gradient(
        circle at right center,
        rgba(75, 41, 105, 0.5) 0%,
        rgb(86, 50, 119) 25%,
        rgba(74, 55, 140, 1) 40%,
        rgb(64, 102, 168) 65%,
        rgba(50, 81, 115, 0.5) 100%
      );
    mask-image: radial-gradient(
      ellipse 150% 30% at center center,
      rgba(0, 0, 0, 1) 20%,
      rgba(0, 0, 0, 0.5) 50%,
      rgba(0, 0, 0, 0) 100%
    );
  }

  @media (min-width: 1500px) {
    background: url('/noise.png'),
      radial-gradient(
        circle at right center,
        rgba(75, 41, 105, 0.5) 0%,
        rgb(86, 50, 119) 25%,
        rgba(74, 55, 140, 1) 45%,
        rgb(64, 102, 168) 65%,
        rgba(50, 81, 115, 0.5) 100%
      );
    mask-image: radial-gradient(
      ellipse 80% 40% at center center,
      rgba(0, 0, 0, 1) 20%,
      rgba(0, 0, 0, 0.5) 50%,
      rgba(0, 0, 0, 0) 100%
    );
  }

  @media (min-width: 1800px) {
    background: url('/noise.png'),
      radial-gradient(
        circle at right center,
        rgba(75, 41, 105, 0.5) 0%,
        rgb(86, 50, 119) 25%,
        rgba(74, 55, 140, 1) 50%,
        rgb(64, 102, 168) 70%,
        rgba(50, 81, 115, 0.5) 100%
      );
    mask-image: radial-gradient(
      ellipse 80% 40% at center center,
      rgba(0, 0, 0, 1) 20%,
      rgba(0, 0, 0, 0.5) 50%,
      rgba(0, 0, 0, 0) 100%
    );
  }

  &.active {
    opacity: 0.4;

    @media (min-width: 768px) {
      opacity: 0.7;
    }
  }
}

@keyframes rotateGradient {
  0% {
    border-image-source: linear-gradient(
      to bottom right,
      rgba(0, 0, 0, 0) 60%,
      rgba(255, 255, 255, 0.15) 65%,
      rgba(0, 0, 0, 0) 90%
    );
  }
  25% {
    border-image-source: linear-gradient(
      to right top,
      rgba(0, 0, 0, 0) 60%,
      rgba(255, 255, 255, 0.15) 65%,
      rgba(0, 0, 0, 0) 90%
    );
  }
  50% {
    border-image-source: linear-gradient(
      to top left,
      rgba(0, 0, 0, 0) 60%,
      rgba(255, 255, 255, 0.15) 65%,
      rgba(0, 0, 0, 0) 90%
    );
  }
  75% {
    border-image-source: linear-gradient(
      to left bottom,
      rgba(0, 0, 0, 0) 60%,
      rgba(255, 255, 255, 0.15) 65%,
      rgba(0, 0, 0, 0) 90%
    );
  }
  100% {
    border-image-source: linear-gradient(
      to bottom right,
      rgba(0, 0, 0, 0) 60%,
      rgba(255, 255, 255, 0.15) 65%,
      rgba(0, 0, 0, 0) 90%
    );
  }
}
</style>
