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

      <!-- Line 1 Glow -->
      <SvgGlowDot
        path="M843.463 1.3315L245.316 5.47507L0.633077 4.69725"
        :position="nodeGlow1.x"
        dot-color="#ce9bf4"
        glow-color="#BD34FE"
      />
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
      xmlns="http://www.w3.org/2000/svg"
      width="141"
      height="85"
      viewBox="0 0 141 85"
      fill="none"
      class="blue-indicator"
    >
      <g opacity="0.2" filter="url(#filter0_d_423_13900)">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M135.731 3.80005V45.9271C135.731 52.3014 130.564 57.4688 124.189 57.4688H39.9353V55.1605H124.189C129.289 55.1605 133.423 51.0266 133.423 45.9271V3.80005H135.731Z"
          fill="#0D0D0D"
        />
        <path
          d="M136.02 3.80005V3.51151H135.731H133.423H133.134V3.80005V45.9271C133.134 50.8672 129.13 54.8719 124.189 54.8719H39.9353H39.6468V55.1605V57.4688V57.7573H39.9353H124.189C130.723 57.7573 136.02 52.4608 136.02 45.9271V3.80005Z"
          stroke="#404040"
          stroke-width="0.577083"
        />
      </g>
      <g filter="url(#filter1_d_423_13900)">
        <g filter="url(#filter2_i_423_13900)">
          <rect
            x="11.6582"
            y="70.7417"
            width="30.0083"
            height="30.0083"
            rx="5.01812"
            transform="rotate(-90 11.6582 70.7417)"
            fill="#1F1F1F"
          />
        </g>
        <rect
          x="11.6582"
          y="70.7417"
          width="30.0083"
          height="30.0083"
          rx="5.01812"
          transform="rotate(-90 11.6582 70.7417)"
          stroke="#2C2C2C"
          stroke-opacity="0.4"
          stroke-width="3.75141"
        />
      </g>
      <g filter="url(#filter3_f_423_13900)">
        <path
          d="M18.063 58.7949C18.063 58.1369 18.5964 57.6035 19.2543 57.6035H24.0196C24.6776 57.6035 25.211 58.1369 25.211 58.7949V63.5602C25.211 64.2181 24.6776 64.7515 24.0196 64.7515H19.2543C18.5964 64.7515 18.063 64.2181 18.063 63.5602V58.7949Z"
          fill="#41D1FF"
        />
        <path
          d="M27.5936 58.7949C27.5936 58.1369 28.127 57.6035 28.785 57.6035H33.5503C34.2083 57.6035 34.7416 58.1369 34.7416 58.7949V63.5602C34.7416 64.2181 34.2083 64.7515 33.5503 64.7515H28.785C28.127 64.7515 27.5936 64.2181 27.5936 63.5602V58.7949Z"
          fill="#41D1FF"
        />
        <path
          d="M27.5936 48.4697C27.5936 47.8117 28.127 47.2783 28.785 47.2783H33.5503C34.2083 47.2783 34.7416 47.8117 34.7416 48.4697V53.235C34.7416 53.8929 34.2083 54.4263 33.5503 54.4263H28.785C28.127 54.4263 27.5936 53.8929 27.5936 53.235V48.4697Z"
          fill="#41D1FF"
        />
      </g>
      <path
        d="M18.063 58.7949C18.063 58.1369 18.5964 57.6035 19.2543 57.6035H24.0196C24.6776 57.6035 25.211 58.1369 25.211 58.7949V63.5602C25.211 64.2181 24.6776 64.7515 24.0196 64.7515H19.2543C18.5964 64.7515 18.063 64.2181 18.063 63.5602V58.7949Z"
        fill="#41D1FF"
      />
      <path
        d="M18.063 58.7949C18.063 58.1369 18.5964 57.6035 19.2543 57.6035H24.0196C24.6776 57.6035 25.211 58.1369 25.211 58.7949V63.5602C25.211 64.2181 24.6776 64.7515 24.0196 64.7515H19.2543C18.5964 64.7515 18.063 64.2181 18.063 63.5602V58.7949Z"
        fill="white"
        fill-opacity="0.5"
      />
      <path
        d="M27.5936 58.7949C27.5936 58.1369 28.127 57.6035 28.785 57.6035H33.5503C34.2083 57.6035 34.7416 58.1369 34.7416 58.7949V63.5602C34.7416 64.2181 34.2083 64.7515 33.5503 64.7515H28.785C28.127 64.7515 27.5936 64.2181 27.5936 63.5602V58.7949Z"
        fill="#41D1FF"
      />
      <path
        d="M27.5936 58.7949C27.5936 58.1369 28.127 57.6035 28.785 57.6035H33.5503C34.2083 57.6035 34.7416 58.1369 34.7416 58.7949V63.5602C34.7416 64.2181 34.2083 64.7515 33.5503 64.7515H28.785C28.127 64.7515 27.5936 64.2181 27.5936 63.5602V58.7949Z"
        fill="white"
        fill-opacity="0.5"
      />
      <path
        d="M27.5936 48.4697C27.5936 47.8117 28.127 47.2783 28.785 47.2783H33.5503C34.2083 47.2783 34.7416 47.8117 34.7416 48.4697V53.235C34.7416 53.8929 34.2083 54.4263 33.5503 54.4263H28.785C28.127 54.4263 27.5936 53.8929 27.5936 53.235V48.4697Z"
        fill="#41D1FF"
      />
      <path
        d="M27.5936 48.4697C27.5936 47.8117 28.127 47.2783 28.785 47.2783H33.5503C34.2083 47.2783 34.7416 47.8117 34.7416 48.4697V53.235C34.7416 53.8929 34.2083 54.4263 33.5503 54.4263H28.785C28.127 54.4263 27.5936 53.8929 27.5936 53.235V48.4697Z"
        fill="white"
        fill-opacity="0.5"
      />
      <path
        d="M18.063 48.4697C18.063 47.8117 18.5964 47.2783 19.2543 47.2783H24.0196C24.6776 47.2783 25.211 47.8117 25.211 48.4697V53.235C25.211 53.8929 24.6776 54.4263 24.0196 54.4263H19.2543C18.5964 54.4263 18.063 53.8929 18.063 53.235V48.4697Z"
        fill="#41D1FF"
      />
      <path
        d="M18.063 48.4697C18.063 47.8117 18.5964 47.2783 19.2543 47.2783H24.0196C24.6776 47.2783 25.211 47.8117 25.211 48.4697V53.235C25.211 53.8929 24.6776 54.4263 24.0196 54.4263H19.2543C18.5964 54.4263 18.063 53.8929 18.063 53.235V48.4697Z"
        fill="white"
        fill-opacity="0.5"
      />
      <defs>
        <filter
          id="filter0_d_423_13900"
          x="34.7415"
          y="0.914567"
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
            result="effect1_dropShadow_423_13900"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_423_13900"
            result="shape"
          />
        </filter>
        <filter
          id="filter1_d_423_13900"
          x="1.7033"
          y="34.241"
          width="49.9181"
          height="49.9181"
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
          <feOffset dy="3.4625" />
          <feGaussianBlur stdDeviation="4.03958" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_423_13900"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_423_13900"
            result="shape"
          />
        </filter>
        <filter
          id="filter2_i_423_13900"
          x="9.78247"
          y="38.8577"
          width="33.7598"
          height="33.7598"
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
          <feBlend
            mode="normal"
            in2="shape"
            result="effect1_innerShadow_423_13900"
          />
        </filter>
        <filter
          id="filter3_f_423_13900"
          x="0.460676"
          y="29.676"
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
            result="effect1_foregroundBlur_423_13900"
          />
        </filter>
      </defs>
    </svg>

    <!-- Pink Indicator -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="142"
      height="87"
      viewBox="0 0 142 87"
      fill="none"
      class="pink-indicator"
    >
      <g opacity="0.2" filter="url(#filter0_d_423_13918)">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M5.93317 79.4614L5.93317 37.3344C5.93317 30.9601 11.1006 25.7927 17.4748 25.7927L101.729 25.7927L101.729 28.101L17.4748 28.101C12.3754 28.101 8.2415 32.2349 8.2415 37.3344L8.24151 79.4614L5.93317 79.4614Z"
          fill="#0D0D0D"
        />
        <path
          d="M5.64463 79.4614L5.64463 79.75L5.93317 79.75L8.24151 79.75L8.53005 79.75L8.53005 79.4614L8.53005 37.3344C8.53005 32.3943 12.5348 28.3896 17.4748 28.3896L101.729 28.3895L102.018 28.3895L102.018 28.101L102.018 25.7927L102.018 25.5041L101.729 25.5041L17.4748 25.5041C10.9412 25.5041 5.64463 30.8007 5.64463 37.3344L5.64463 79.4614Z"
          stroke="#404040"
          stroke-width="0.577083"
        />
      </g>
      <g filter="url(#filter1_d_423_13918)">
        <g filter="url(#filter2_i_423_13918)">
          <rect
            x="130.583"
            y="12.521"
            width="30.0083"
            height="30.0083"
            rx="5.01812"
            transform="rotate(90 130.583 12.521)"
            fill="#1F1F1F"
          />
        </g>
        <rect
          x="130.583"
          y="12.521"
          width="30.0083"
          height="30.0083"
          rx="5.01812"
          transform="rotate(90 130.583 12.521)"
          stroke="#2C2C2C"
          stroke-opacity="0.4"
          stroke-width="3.75141"
        />
      </g>
      <g filter="url(#filter3_f_423_13918)">
        <path
          d="M123.601 24.4666C123.601 25.1246 123.068 25.6579 122.41 25.6579L117.645 25.6579C116.987 25.6579 116.453 25.1246 116.453 24.4666L116.453 19.7013C116.453 19.0433 116.987 18.51 117.645 18.51L122.41 18.51C123.068 18.51 123.601 19.0433 123.601 19.7013L123.601 24.4666Z"
          fill="#BD34FE"
        />
        <path
          d="M114.071 24.4666C114.071 25.1246 113.537 25.6579 112.879 25.6579L108.114 25.6579C107.456 25.6579 106.923 25.1246 106.923 24.4666L106.923 19.7013C106.923 19.0433 107.456 18.51 108.114 18.51L112.879 18.51C113.537 18.51 114.071 19.0433 114.071 19.7013L114.071 24.4666Z"
          fill="#BD34FE"
        />
        <path
          d="M114.071 34.7918C114.071 35.4498 113.537 35.9832 112.879 35.9832L108.114 35.9832C107.456 35.9832 106.923 35.4498 106.923 34.7918L106.923 30.0265C106.923 29.3685 107.456 28.8352 108.114 28.8352L112.879 28.8352C113.537 28.8352 114.071 29.3685 114.071 30.0265L114.071 34.7918Z"
          fill="#BD34FE"
        />
      </g>
      <g filter="url(#filter4_f_423_13918)">
        <rect
          x="108.654"
          y="20.5999"
          width="13.85"
          height="13.85"
          rx="1.73125"
          fill="#BD34FE"
          fill-opacity="0.5"
        />
      </g>
      <rect
        x="110.962"
        y="22.9082"
        width="9.23333"
        height="9.23333"
        rx="1.15417"
        fill="#BD34FE"
      />
      <rect
        x="110.962"
        y="22.9082"
        width="9.23333"
        height="9.23333"
        rx="1.15417"
        fill="white"
        fill-opacity="0.5"
      />
      <defs>
        <filter
          id="filter0_d_423_13918"
          x="0.739534"
          y="22.9072"
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
            result="effect1_dropShadow_423_13918"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_423_13918"
            result="shape"
          />
        </filter>
        <filter
          id="filter1_d_423_13918"
          x="90.6201"
          y="6.0286"
          width="49.9181"
          height="49.9181"
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
          <feOffset dy="3.4625" />
          <feGaussianBlur stdDeviation="4.03958" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_423_13918"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_423_13918"
            result="shape"
          />
        </filter>
        <filter
          id="filter2_i_423_13918"
          x="98.6992"
          y="10.6453"
          width="33.7598"
          height="33.7598"
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
          <feBlend
            mode="normal"
            in2="shape"
            result="effect1_innerShadow_423_13918"
          />
        </filter>
        <filter
          id="filter3_f_423_13918"
          x="89.3203"
          y="0.907698"
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
            result="effect1_foregroundBlur_423_13918"
          />
        </filter>
        <filter
          id="filter4_f_423_13918"
          x="97.1124"
          y="9.05819"
          width="36.9334"
          height="36.9334"
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
            result="effect1_foregroundBlur_423_13918"
          />
        </filter>
      </defs>
    </svg>

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

<style scoped lang="scss">
.hero__diagram {
  pointer-events: none;
  position: relative;
  z-index: 2;
  width: 1630px;
  overflow: hidden;
  margin: -120px auto 0;
}

.blue-indicator {
  position: absolute;
  top: 386px;
  left: 680px;
}

.pink-indicator {
  position: absolute;
  top: 182px;
  left: 850px;
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
