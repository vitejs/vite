<script setup>
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { onMounted, ref } from 'vue'
import SvgGlowDot from './SvgGlowDot.vue'

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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="844"
      height="644"
      viewBox="0 0 844 644"
      fill="none"
      class="input-lines"
    >
      <!-- Input Lines -->
      <g v-for="inputLine in inputLines">
        <path
          :d="inputLine.path"
          stroke="url(#base_gradient)"
          stroke-width="1.2"
        />
        <SvgGlowDot
          :path="inputLine.path"
          :position="inputLine.position.value"
          :visible="inputLine.visible.value"
          :label-visible="inputLine.labelVisible.value"
          :label="inputLine.label.value"
        />
      </g>

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
          <stop offset="0.5" stop-color="white" stop-opacity="0.33" />
          <stop offset="0.7" stop-color="white" stop-opacity="0.2" />
          <stop offset="0.9" stop-color="white" stop-opacity="0" />
        </linearGradient>
      </defs>
    </svg>

    <!-- Output Line -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="844"
      height="80"
      viewBox="0 0 844 40"
      fill="none"
      class="output-line"
    >
      <!-- Line 1 -->
      <path
        d="M843.463 1.3315L245.316 5.47507L0.633077 4.69725"
        stroke="url(#output_gradient)"
        stroke-width="1.2"
      />

      <!-- Output Lines -->
      <g v-for="outputLine in outputLines">
        <SvgGlowDot
          path="M843.463 1.3315L245.316 5.47507L0.633077 4.69725"
          :position="outputLine.position.value"
          :visible="outputLine.visible.value"
          :label-visible="outputLine.labelVisible.value"
          :label="outputLine.label.value"
          dot-color="#ce9bf4"
          glow-color="#BD34FE"
        />
      </g>

      <defs>
        <linearGradient id="output_gradient" gradientUnits="userSpaceOnUse">
          <stop offset="0.1" stop-color="white" stop-opacity="0" />
          <stop offset="0.4" stop-color="white" stop-opacity="0.33" />
          <stop offset="1" stop-color="white" stop-opacity="0" />
        </linearGradient>
      </defs>
    </svg>

    <!-- Blue Indicator -->
    <svg
      width="142"
      height="82"
      viewBox="0 0 142 82"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="blue-indicator"
    >
      <g opacity="0.2" filter="url(#filter0_d_1_2)">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M136.073 3V45.1271C136.073 51.5014 130.905 56.6688 124.531 56.6688H40.2769V54.3604H124.531C129.63 54.3604 133.764 50.2265 133.764 45.1271V3H136.073Z"
          fill="#0D0D0D"
        />
        <path
          d="M136.361 3V2.71146H136.073H133.764H133.476V3V45.1271C133.476 50.0672 129.471 54.0719 124.531 54.0719H40.2769H39.9883V54.3604V56.6688V56.9573H40.2769H124.531C131.065 56.9573 136.361 51.6607 136.361 45.1271V3Z"
          stroke="#404040"
          stroke-width="0.577083"
        />
      </g>
      <g filter="url(#filter1_i_1_2)">
        <rect
          x="12"
          y="69.9419"
          width="30.0083"
          height="30.0083"
          rx="5.01812"
          transform="rotate(-90 12 69.9419)"
          fill="#1F1F1F"
        />
      </g>
      <rect
        x="12"
        y="69.9419"
        width="30.0083"
        height="30.0083"
        rx="5.01812"
        transform="rotate(-90 12 69.9419)"
        stroke="#2C2C2C"
        stroke-opacity="0.4"
        stroke-width="3.75141"
      />
      <path
        d="M18.4048 57.9946C18.4048 57.3366 18.9382 56.8032 19.5961 56.8032H24.3614C25.0194 56.8032 25.5528 57.3366 25.5528 57.9946V62.7599C25.5528 63.4179 25.0194 63.9512 24.3614 63.9512H19.5961C18.9382 63.9512 18.4048 63.4179 18.4048 62.7599V57.9946Z"
        fill="#41D1FF"
      />
      <path
        d="M18.4048 57.9946C18.4048 57.3366 18.9382 56.8032 19.5961 56.8032H24.3614C25.0194 56.8032 25.5528 57.3366 25.5528 57.9946V62.7599C25.5528 63.4179 25.0194 63.9512 24.3614 63.9512H19.5961C18.9382 63.9512 18.4048 63.4179 18.4048 62.7599V57.9946Z"
        fill="white"
        fill-opacity="0.5"
      />
      <path
        d="M27.9354 57.9946C27.9354 57.3366 28.4688 56.8032 29.1268 56.8032H33.8921C34.5501 56.8032 35.0834 57.3366 35.0834 57.9946V62.7599C35.0834 63.4179 34.5501 63.9512 33.8921 63.9512H29.1268C28.4688 63.9512 27.9354 63.4179 27.9354 62.7599V57.9946Z"
        fill="#41D1FF"
      />
      <path
        d="M27.9354 57.9946C27.9354 57.3366 28.4688 56.8032 29.1268 56.8032H33.8921C34.5501 56.8032 35.0834 57.3366 35.0834 57.9946V62.7599C35.0834 63.4179 34.5501 63.9512 33.8921 63.9512H29.1268C28.4688 63.9512 27.9354 63.4179 27.9354 62.7599V57.9946Z"
        fill="white"
        fill-opacity="0.5"
      />
      <path
        d="M27.9354 47.6694C27.9354 47.0114 28.4688 46.478 29.1268 46.478H33.8921C34.5501 46.478 35.0834 47.0114 35.0834 47.6694V52.4347C35.0834 53.0926 34.5501 53.626 33.8921 53.626H29.1268C28.4688 53.626 27.9354 53.0926 27.9354 52.4347V47.6694Z"
        fill="#41D1FF"
      />
      <path
        d="M27.9354 47.6694C27.9354 47.0114 28.4688 46.478 29.1268 46.478H33.8921C34.5501 46.478 35.0834 47.0114 35.0834 47.6694V52.4347C35.0834 53.0926 34.5501 53.626 33.8921 53.626H29.1268C28.4688 53.626 27.9354 53.0926 27.9354 52.4347V47.6694Z"
        fill="white"
        fill-opacity="0.5"
      />
      <path
        d="M18.4048 47.6694C18.4048 47.0114 18.9382 46.478 19.5961 46.478H24.3614C25.0194 46.478 25.5528 47.0114 25.5528 47.6694V52.4347C25.5528 53.0926 25.0194 53.626 24.3614 53.626H19.5961C18.9382 53.626 18.4048 53.0926 18.4048 52.4347V47.6694Z"
        fill="#41D1FF"
      />
      <path
        d="M18.4048 47.6694C18.4048 47.0114 18.9382 46.478 19.5961 46.478H24.3614C25.0194 46.478 25.5528 47.0114 25.5528 47.6694V52.4347C25.5528 53.0926 25.0194 53.626 24.3614 53.626H19.5961C18.9382 53.626 18.4048 53.0926 18.4048 52.4347V47.6694Z"
        fill="white"
        fill-opacity="0.5"
      />
      <g filter="url(#filter2_f_1_2)">
        <path
          d="M18.4048 57.9946C18.4048 57.3366 18.9382 56.8032 19.5961 56.8032H24.3614C25.0194 56.8032 25.5528 57.3366 25.5528 57.9946V62.7599C25.5528 63.4179 25.0194 63.9512 24.3614 63.9512H19.5961C18.9382 63.9512 18.4048 63.4179 18.4048 62.7599V57.9946Z"
          fill="#41D1FF"
        />
        <path
          d="M27.9354 57.9946C27.9354 57.3366 28.4688 56.8032 29.1268 56.8032H33.8921C34.5501 56.8032 35.0834 57.3366 35.0834 57.9946V62.7599C35.0834 63.4179 34.5501 63.9512 33.8921 63.9512H29.1268C28.4688 63.9512 27.9354 63.4179 27.9354 62.7599V57.9946Z"
          fill="#41D1FF"
        />
        <path
          d="M27.9354 47.6694C27.9354 47.0114 28.4688 46.478 29.1268 46.478H33.8921C34.5501 46.478 35.0834 47.0114 35.0834 47.6694V52.4347C35.0834 53.0926 34.5501 53.626 33.8921 53.626H29.1268C28.4688 53.626 27.9354 53.0926 27.9354 52.4347V47.6694Z"
          fill="#41D1FF"
        />
      </g>
      <defs>
        <filter
          id="filter0_d_1_2"
          x="35.0831"
          y="0.114583"
          width="106.183"
          height="64.0563"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="2.30833" />
          <feGaussianBlur stdDeviation="2.30833" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.65 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1_2"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_1_2"
            result="shape"
          />
        </filter>
        <filter
          id="filter1_i_1_2"
          x="10.1243"
          y="38.0579"
          width="33.7597"
          height="33.7597"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="2.30833" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.85 0"
          />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow_1_2" />
        </filter>
        <filter
          id="filter2_f_1_2"
          x="0.802473"
          y="28.8757"
          width="51.8833"
          height="52.6778"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="8.80116"
            result="effect1_foregroundBlur_1_2"
          />
        </filter>
      </defs>
    </svg>

    <!-- Blue Glow -->
    <div class="blue-glow" />

    <!-- Pink Indicator -->
    <svg
      width="141"
      height="67"
      viewBox="0 0 141 67"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="pink-indicator"
    >
      <g opacity="0.2" filter="url(#filter0_d_1_8)">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M5.48397 58.9922L5.48397 36.8651C5.48397 30.4908 10.6514 25.3234 17.0256 25.3234L101.28 25.3234L101.28 27.6318L17.0256 27.6318C11.9262 27.6318 7.7923 31.7657 7.7923 36.8651L7.7923 58.9922L5.48397 58.9922Z"
          fill="#0D0D0D"
        />
        <path
          d="M5.19543 58.9922L5.19543 59.2807L5.48397 59.2807L7.79231 59.2807L8.08085 59.2807L8.08085 58.9922L8.08085 36.8651C8.08085 31.925 12.0856 27.9203 17.0256 27.9203L101.28 27.9203L101.568 27.9203L101.568 27.6318L101.568 25.3234L101.568 25.0349L101.28 25.0349L17.0256 25.0349C10.492 25.0349 5.19542 30.3315 5.19543 36.8651L5.19543 58.9922Z"
          stroke="#404040"
          stroke-width="0.577083"
        />
      </g>
      <g filter="url(#filter1_i_1_8)">
        <rect
          x="130.134"
          y="12.0518"
          width="30.0083"
          height="30.0083"
          rx="5.01812"
          transform="rotate(90 130.134 12.0518)"
          fill="#1F1F1F"
        />
      </g>
      <rect
        x="130.134"
        y="12.0518"
        width="30.0083"
        height="30.0083"
        rx="5.01812"
        transform="rotate(90 130.134 12.0518)"
        stroke="#2C2C2C"
        stroke-opacity="0.4"
        stroke-width="3.75141"
      />
      <g filter="url(#filter2_f_1_8)">
        <path
          d="M123.152 23.9976C123.152 24.6556 122.619 25.1889 121.961 25.1889L117.196 25.1889C116.538 25.1889 116.004 24.6556 116.004 23.9976L116.004 19.2323C116.004 18.5743 116.538 18.041 117.196 18.041L121.961 18.041C122.619 18.041 123.152 18.5743 123.152 19.2323L123.152 23.9976Z"
          fill="#BD34FE"
        />
        <path
          d="M113.622 23.9976C113.622 24.6556 113.088 25.1889 112.43 25.1889L107.665 25.1889C107.007 25.1889 106.474 24.6556 106.474 23.9976L106.474 19.2323C106.474 18.5743 107.007 18.041 107.665 18.041L112.43 18.041C113.088 18.041 113.622 18.5743 113.622 19.2323L113.622 23.9976Z"
          fill="#BD34FE"
        />
        <path
          d="M113.622 34.3228C113.622 34.9808 113.088 35.5142 112.43 35.5142L107.665 35.5142C107.007 35.5142 106.474 34.9808 106.474 34.3228L106.474 29.5575C106.474 28.8996 107.007 28.3662 107.665 28.3662L112.43 28.3662C113.088 28.3662 113.622 28.8996 113.622 29.5575L113.622 34.3228Z"
          fill="#BD34FE"
        />
      </g>
      <rect
        x="110.513"
        y="22.439"
        width="9.23333"
        height="9.23333"
        rx="1.15417"
        fill="#BD34FE"
      />
      <rect
        x="110.513"
        y="22.439"
        width="9.23333"
        height="9.23333"
        rx="1.15417"
        fill="white"
        fill-opacity="0.5"
      />
      <g filter="url(#filter3_f_1_8)">
        <rect
          x="108.205"
          y="20.1309"
          width="13.85"
          height="13.85"
          rx="1.73125"
          fill="#BD34FE"
          fill-opacity="0.5"
        />
      </g>
      <defs>
        <filter
          id="filter0_d_1_8"
          x="0.290218"
          y="22.438"
          width="106.183"
          height="44.0563"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="2.30833" />
          <feGaussianBlur stdDeviation="2.30833" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.65 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1_8"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_1_8"
            result="shape"
          />
        </filter>
        <filter
          id="filter1_i_1_8"
          x="98.2503"
          y="10.1761"
          width="33.7597"
          height="33.7597"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="2.30833" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.85 0"
          />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow_1_8" />
        </filter>
        <filter
          id="filter2_f_1_8"
          x="88.8714"
          y="0.438646"
          width="51.8833"
          height="52.6778"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="8.80116"
            result="effect1_foregroundBlur_1_8"
          />
        </filter>
        <filter
          id="filter3_f_1_8"
          x="96.6634"
          y="8.58919"
          width="36.9333"
          height="36.9333"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="5.77083"
            result="effect1_foregroundBlur_1_8"
          />
        </filter>
      </defs>
    </svg>

    <!-- Pink Glow -->
    <div class="pink-glow" />

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

.blue-indicator {
  position: absolute;
  top: 387px;
  left: 680px;
  opacity: 0.9;
}

.blue-glow {
  background-color: #41d1ff;
  width: 100px;
  aspect-ratio: 2;
  position: absolute;
  top: 415px;
  left: 650px;
  z-index: -1;
  filter: blur(50px);
}

.pink-indicator {
  position: absolute;
  top: 202px;
  left: 840px;
  opacity: 0.9;
}

.pink-glow {
  background-color: #bd34fe;
  width: 100px;
  aspect-ratio: 2;
  position: absolute;
  top: 202px;
  left: 900px;
  z-index: -1;
  filter: blur(50px);
}

.output-line {
  position: absolute;
  top: 300px;
  left: 785px;
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
