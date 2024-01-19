<script setup lang="ts">
defineProps({
  active: {
    type: Boolean,
    required: true,
    default: false,
  },
})
</script>

<template>
  <svg
    width="141"
    height="67"
    viewBox="0 0 141 67"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="pink-indicator"
    :class="{ active: active }"
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
      v-show="active"
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
        v-show="active"
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
  <div class="pink-glow" :class="{ active: active }" />
</template>

<style scoped>
.pink-indicator {
  position: absolute;
  top: 202px;
  left: 840px;
  opacity: 0.2;
  transition: opacity 1s ease-in-out;

  &.active {
    transition: opacity 0.2s ease-in-out;
    opacity: 0.6;
  }
}

.pink-glow {
  background-color: #bd34fe;
  width: 100px;
  aspect-ratio: 2;
  position: absolute;
  top: 202px;
  left: 905px;
  z-index: -1;
  filter: blur(40px);
  opacity: 0;
  transition: all 3s ease-out;
  will-change: opacity;
  display: none;

  @media (min-width: 768px) {
    display: block;
    filter: blur(60px);
  }

  &.active {
    transition: all 0.2s ease-in-out;
    opacity: 0.8;
  }
}
</style>
