<script setup lang="ts">
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/dist/MotionPathPlugin'
import { nextTick, onMounted, ref } from 'vue'
import SvgInputs from './svg-elements/SvgInputs.vue'
import SvgOutputs from './svg-elements/SvgOutputs.vue'
import SvgBlueIndicator from './svg-elements/SvgBlueIndicator.vue'
import SvgPinkIndicator from './svg-elements/SvgPinkIndicator.vue'

gsap.registerPlugin(MotionPathPlugin)

// Input paths
const inputPaths = [
  'M843.505 284.659L752.638 284.659C718.596 284.659 684.866 280.049 653.251 271.077L598.822 255.629L0.675021 1.00011',
  'M843.505 298.181L724.342 297.36C708.881 297.36 693.45 296.409 678.22 294.518L598.822 284.659C592.82 284.659 200.538 190.002 0.675028 164.892',
  'M843.505 311.703L701.108 310.061L598.822 305.136L0.675049 256.071',
  'M843.505 325.224L598.822 326.002L0.675049 321.858',
  'M843.505 338.746L701.108 340.388L598.822 345.442L0.675038 387.646',
  'M843.505 352.268L724.342 353.088C708.881 353.088 693.45 354.039 678.22 355.93L598.822 365.789L0.675067 478.825',
  'M843.505 365.789L752.638 365.789C718.596 365.789 684.866 370.399 653.251 379.372L598.822 394.82L0.675049 642.717',
]

// Input lines
const inputLines = inputPaths.map((path) => ({
  position: ref(0),
  visible: ref(false),
  labelVisible: ref(false),
  label: ref(''),
  path,
}))

// Input File Sets
const inputFileSets = ref([
  ['.jsx', '.sass', '.vue'],
  ['.tsx', '.scss', '.vue'],
  ['.js', '.styl', '.vue'],
  ['.ts', '.less', '.vue'],
  ['.svg', '.html', '.json'],
])

// Output lines
const outputLines = [
  {
    position: ref(0),
    visible: ref(false),
    labelVisible: ref(false),
    label: ref('.html'),
  },
  {
    position: ref(0),
    visible: ref(false),
    labelVisible: ref(false),
    label: ref('.css'),
  },
  {
    position: ref(0),
    visible: ref(false),
    labelVisible: ref(false),
    label: ref('.js'),
  },
]

// Indicators
const blueIndicator = ref(false)
const pinkIndicator = ref(false)
const illuminateLogo = ref(false)

/**
 * Start all animations when mounted
 */
onMounted(() => {
  nextTick(() => {
    gsap
      .timeline({
        scrollTrigger: {
          trigger: '#hero-diagram',
          start: 'center 80%',
          once: true,
        },
      })
      .call(animateDiagram)
  })
})

/**
 * The core animation for the hero diagram.
 * Has both a desktop and mobile variation.
 */
const animateDiagram = () => {
  // Determine if we're showing the desktop or mobile variation of the animation
  const isMobile = window.innerWidth < 768

  // Prepare a timeline
  const timeline = gsap.timeline({
    onComplete: animateDiagram,
  })

  // Animate the input nodes/lines
  prepareInputs().forEach((lineIndex, fileIndex) => {
    timeline.add(
      isMobile
        ? animateSingleInputMobile(inputLines[lineIndex])
        : animateSingleInputDesktop(inputLines[lineIndex]),
      fileIndex * (isMobile ? 0.4 : 0.2),
    )
  })

  // Illuminate the logo and colored indicators
  timeline.set(blueIndicator, { value: true }, isMobile ? '>-2' : '>-0.2')
  timeline.set(illuminateLogo, { value: true }, '<-0.3')
  timeline.set(pinkIndicator, { value: true }, '<+0.3')

  // Animate the output nodes/lines
  timeline.addLabel('showOutput', '<+0.4')
  outputLines.forEach((outputLine, index) => {
    timeline.add(
      isMobile
        ? animateSingleOutputMobile(outputLine, index)
        : animateSingleOutputDesktop(outputLine, index),
      'showOutput+=' + (isMobile ? 0.3 : 0.1) * index,
    )
  })

  // Disable the colored indicators
  timeline.set(blueIndicator, { value: false }, '>-1')
  timeline.set(pinkIndicator, { value: false }, '<')

  // Pause briefly at the end of the animation
  timeline.set({}, {}, '+=0.2')
}

/**
 * Randomly selects a set of input file nodes and assigns them to input lines.
 * @returns {any[]}
 */
const prepareInputs = () => {
  // Randomly select a set of input file "nodes"
  const inputFileSet =
    inputFileSets.value[Math.floor(Math.random() * inputFileSets.value.length)]

  // Choose enough unique lines for the input file nodes to slide along
  const inputLineIndexes = new Set()
  while (inputLineIndexes.size < 3) {
    const index = Math.floor(Math.random() * inputLines.length)
    inputLineIndexes.add(index)
  }

  // Assign each line it's appropriate node label
  const inputs = [...inputLineIndexes]
  inputs.forEach((lineIndex, fileIndex) => {
    inputLines[lineIndex].label.value = inputFileSet[fileIndex]
  })
  return inputs
}

/**
 * Animates a single output line for desktop.
 * There are technically 3 output lines, but they are stacked on top of each other.
 * @param outputLine
 * @param index
 */
const animateSingleOutputDesktop = (outputLine, index) => {
  const timeline = gsap.timeline()

  // Reset the line
  timeline.set(
    outputLine.position,
    {
      value: 0,
    },
    0,
  )

  // Animate the dot in
  timeline.to(
    outputLine.position,
    {
      value: (0.7 / 3) * (index + 1) + 0.05,
      duration: 1.5,
      ease: 'expo.out',
    },
    0,
  )

  // Show the dot
  timeline.set(
    outputLine.visible,
    {
      value: true,
    },
    0,
  )

  // Show the label
  timeline.set(
    outputLine.labelVisible,
    {
      value: true,
    },
    0.4,
  )

  // Animate the dot out
  timeline.to(
    outputLine.position,
    {
      value: 1,
      duration: 1.5,
      ease: 'power3.in',
    },
    3,
  )

  // Hide the label
  timeline.set(
    outputLine.labelVisible,
    {
      value: false,
    },
    3.5,
  )

  // Hide the dot
  timeline.set(
    outputLine.visible,
    {
      value: false,
    },
    4,
  )

  return timeline
}

/**
 * Animates a single output line for mobile.
 * There are technically 3 output lines, but they are stacked on top of each other.
 * @param outputLine
 * @param index
 * @returns {gsap.core.Timeline}
 */
const animateSingleOutputMobile = (outputLine, index) => {
  const timeline = gsap.timeline()

  // Reset the line
  timeline.set(
    outputLine.position,
    {
      value: 0,
    },
    0,
  )

  // Animate the dot in
  timeline.to(
    outputLine.position,
    {
      value: 0.7,
      duration: 3,
      ease: 'power2.out',
    },
    0.3,
  )

  // Show the dot
  timeline.set(
    outputLine.visible,
    {
      value: true,
    },
    0.35,
  )

  // Hide the dot
  timeline.set(
    outputLine.visible,
    {
      value: false,
    },
    1,
  )

  return timeline
}

/**
 * Animates a single input line for desktop.
 * @param inputLine
 * @returns {gsap.core.Timeline}
 */
const animateSingleInputDesktop = (inputLine) => {
  const timeline = gsap.timeline()

  // Reset the line
  timeline.set(
    inputLine.position,
    {
      value: 0,
    },
    0,
  )

  // Animate the dot in
  timeline.to(
    inputLine.position,
    {
      value: Math.random() * 0.1 + 0.3,
      duration: 1.5,
      ease: 'expo.out',
    },
    0,
  )

  // Show the dot
  timeline.set(
    inputLine.visible,
    {
      value: true,
    },
    0,
  )

  // Show the label
  timeline.set(
    inputLine.labelVisible,
    {
      value: true,
    },
    0.4,
  )

  // Animate the dot out
  timeline.to(
    inputLine.position,
    {
      value: 1,
      duration: 1.5,
      ease: 'power3.in',
    },
    2,
  )

  // Hide the label
  timeline.set(
    inputLine.labelVisible,
    {
      value: false,
    },
    2.5,
  )

  // Hide the dot
  timeline.set(
    inputLine.visible,
    {
      value: false,
    },
    3,
  )

  // Return the timeline
  return timeline
}

/**
 * Animates a single input line for mobile.
 * @param inputLine
 * @returns {gsap.core.Timeline}
 */
const animateSingleInputMobile = (inputLine) => {
  const timeline = gsap.timeline()

  // Reset the line
  timeline.set(
    inputLine.position,
    {
      value: 0,
    },
    0,
  )

  // Animate the dot in
  timeline.to(
    inputLine.position,
    {
      value: 1,
      duration: 2,
      ease: 'power2.out',
    },
    0,
  )

  // Show the dot
  timeline.set(
    inputLine.visible,
    {
      value: true,
    },
    0,
  )

  // Hide the dot
  timeline.set(
    inputLine.visible,
    {
      value: false,
    },
    0.6,
  )

  // Return the timeline
  return timeline
}
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
        <div class="vite-chip__edge"></div>
      </div>
      <div class="vite-chip__filter" />
      <img src="/logo.svg" alt="Vite Logo" class="vite-chip__logo" />
    </div>
  </div>

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
    transform: translateX(-50%);
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
      rgba(0, 0, 0, 0) 50%,
      rgba(255, 255, 255, 0.15) 60%,
      rgba(0, 0, 0, 0) 90%
    );
  }

  .vite-chip__border {
    position: absolute;
    top: 2px;
    right: 2px;
    left: 2px;
    bottom: 2px;
    border-radius: 10px;
    border: 0 solid rgba(89, 82, 108, 0.3);
    opacity: 0.8;
    background: rgba(40, 40, 40, 0.3);
  }

  .vite-chip__logo {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.9);
    width: 65px;
    opacity: 0.2;
    filter: grayscale(100%);
    transition: all 0.6s ease;
    z-index: 3;
  }

  &.active {
    transform: translate3d(0, 0, 0) scale(1);
    box-shadow: 0 30px 35px -10px rgba(0, 0, 0, 0.6);

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
  opacity: 0.1;
  transition: opacity 2s ease;

  @media (min-width: 768px) {
    transition: opacity 0.5s ease;
  }

  background: radial-gradient(
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
    background: radial-gradient(
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
    background: radial-gradient(
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
    background: radial-gradient(
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
    opacity: 0.6;
  }
}
</style>
