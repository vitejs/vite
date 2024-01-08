<script setup>
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { onMounted, ref } from 'vue'
import SvgInputs from './SvgInputs.vue'
import SvgOutputs from './SvgOutputs.vue'
import SvgBlueIndicator from './SvgBlueIndicator.vue'
import SvgPinkIndicator from './SvgPinkIndicator.vue'

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

/**
 * Start all animations when mounted
 */
onMounted(() => {
  animateDiagram()
})

/**
 * The core animation for the hero diagram.
 */
const animateDiagram = () => {
  const timeline = gsap.timeline({
    onComplete: animateDiagram,
  })
  const inputFileSet =
    inputFileSets.value[Math.floor(Math.random() * inputFileSets.value.length)]
  const inputLineIndexes = new Set()
  while (inputLineIndexes.size < 3) {
    const index = Math.floor(Math.random() * inputLines.length)
    inputLineIndexes.add(index)
  }
  ;[...inputLineIndexes].forEach((lineIndex, fileIndex) => {
    inputLines[lineIndex].label.value = inputFileSet[fileIndex]
    timeline.add(animateInputLine(inputLines[lineIndex]), fileIndex * 0.2)
  })
  outputLines.forEach((outputLine, index) => {
    timeline.add(animateOutputLine(outputLine, index), 3 + 0.2 * index)
  })
}

/**
 * Animates a single output line.
 * There are technically 3 output lines, but they are stacked on top of each other.
 * @param outputLine
 * @param index
 * @returns {gsap.core.Timeline}
 */
const animateOutputLine = (outputLine, index) => {
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
    1.5,
  )

  // Hide the label
  timeline.set(
    outputLine.labelVisible,
    {
      value: false,
    },
    2,
  )

  // Hide the dot
  timeline.set(
    outputLine.visible,
    {
      value: false,
    },
    2.5,
  )

  return timeline
}

/**
 * Animates a single input line
 * @param inputLine
 * @returns {gsap.core.Timeline}
 */
const animateInputLine = (inputLine) => {
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
    1.5,
  )

  // Hide the label
  timeline.set(
    inputLine.labelVisible,
    {
      value: false,
    },
    2,
  )

  // Hide the dot
  timeline.set(
    inputLine.visible,
    {
      value: false,
    },
    2.5,
  )

  // Return the timeline
  return timeline
}
</script>

<template>
  <div class="hero__diagram">
    <!-- Input Lines -->
    <SvgInputs :input-lines="inputLines" />

    <!-- Output Line -->
    <SvgOutputs :output-lines="outputLines" />

    <!-- Blue Indicator -->
    <SvgBlueIndicator />

    <!-- Pink Indicator -->
    <SvgPinkIndicator />

    <!-- Vite Chip -->
    <div class="vite-chip">
      <div class="vite-chip__background">
        <div class="vite-chip__border" />
      </div>
      <div class="vite-chip__filter" />
      <img src="/logo.svg" alt="Vite Logo" class="vite-chip__logo" />
    </div>
  </div>
</template>

<style scoped>
.hero__diagram {
  pointer-events: none;
  position: relative;
  z-index: 2;
  width: 1630px;
  overflow: hidden;
  margin: -100px auto 0;
}

.vite-chip {
  width: 130px;
  height: 130px;
  border: 1px solid rgba(17, 17, 17, 0.2);
  position: absolute;
  left: 750px;
  top: 260px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 18.467px 33.471px 0 rgba(0, 0, 0, 0.5);

  .vite-chip__filter {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
        130deg,
        rgba(0, 0, 0, 0) 10%,
        rgba(160, 160, 160, 0.15) 35%,
        rgba(0, 0, 0, 0) 70%
      ),
      rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(3px);
  }

  .vite-chip__border {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    opacity: 0.5;
    background: rgba(40, 40, 40, 0.3);
  }

  .vite-chip__logo {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    mix-blend-mode: luminosity;
    width: 67px;
    opacity: 0.5;
    filter: grayscale(100%);
  }
}
</style>
