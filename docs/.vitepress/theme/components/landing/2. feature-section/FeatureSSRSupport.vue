<script setup lang="ts">
import { useSlideIn } from '../../../composables/useSlideIn'
import { useCardAnimation } from '../../../composables/useCardAnimation'

/**
 * Slide the card in when the page loads
 */
useSlideIn('#ssr-support')

/**
 * Start the animation when the card is hovered
 */
const { isCardActive, startAnimation } = useCardAnimation(
  '#ssr-support',
  undefined,
  {
    once: true,
  },
)
</script>

<template>
  <div
    class="feature-card"
    id="ssr-support"
    @mouseover.stop.prevent="startAnimation"
  >
    <div class="feature__visualization" :class="{ active: isCardActive }">
      <svg
        width="402"
        height="166"
        viewBox="0 0 402 166"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style="margin-top: 10px"
      >
        <!-- JS Box -->
        <g class="js">
          <g class="js__glow" filter="url(#filter-js-glow)">
            <rect
              x="30"
              y="31.0947"
              width="104"
              height="104"
              rx="16.2078"
              fill="url(#linear-js-glow)"
            />
            <rect
              x="30.6753"
              y="31.7701"
              width="102.649"
              height="102.649"
              rx="15.5325"
              stroke="#A3A3A3"
              stroke-width="1.35065"
            />
          </g>
          <g class="js__bg" filter="url(#filter-js-bg)">
            <rect
              x="30"
              y="31.0947"
              width="104"
              height="104"
              rx="16.2078"
              fill="url(#linear-js-bg)"
            />
          </g>
          <rect
            class="js__border"
            x="30.6753"
            y="31.7701"
            width="102.649"
            height="102.649"
            rx="15.5325"
            stroke="#A3A3A3"
            stroke-width="1.2"
          />
        </g>

        <!-- JS Text -->
        <text class="js-text" x="80" y="120">.JS</text>

        <!-- Connector -->
        <path
          class="connector"
          opacity="0.25"
          d="M133.5 84.5H164M164 84.5V58.5C164 52.4249 168.925 47.5 175 47.5H193.5M164 84.5V108C164 114.075 168.925 119 175 119H193.5"
        />

        <!-- Client Transform Box -->
        <g class="client" filter="url(#filter-client)">
          <g clip-path="url(#clip-client)">
            <rect
              class="client__bg"
              x="193"
              y="20"
              width="182"
              height="54"
              fill="url(#linear-client-bg)"
              fill-opacity="0.1"
            />
            <g class="client__glow" filter="url(#filter-client-glow)">
              <rect
                x="213"
                y="41.5342"
                width="12"
                height="12"
                rx="1"
                fill="#FFE358"
              />
            </g>
            <rect
              class="client__indicator"
              x="212.777"
              y="41.5338"
              width="12"
              height="12"
              rx="1"
            />
          </g>
          <rect
            class="client__border"
            x="193.507"
            y="22.507"
            width="180.986"
            height="50.0537"
            rx="11.661"
            stroke="#737373"
            stroke-opacity="0.3"
            stroke-width="1.014"
          />
        </g>

        <!-- Client Transform Text -->
        <text class="client-text" x="236" y="53">Client transform</text>

        <!-- Server Transform Box -->
        <g class="server" filter="url(#filter-server)">
          <g clip-path="url(#clip-server)">
            <rect
              class="server__bg"
              x="193"
              y="90"
              width="186"
              height="54"
              fill="url(#linear-server-bg)"
              fill-opacity="0.1"
            />
            <g class="server__glow" filter="url(#filter-server-glow)">
              <circle cx="218.933" cy="117.534" r="5.93296" fill="#FFE358" />
            </g>
            <rect
              class="server__indicator"
              x="212.777"
              y="111.74"
              width="12"
              height="12"
              rx="1"
            />
          </g>
          <rect
            x="193.507"
            y="92.7135"
            width="181.402"
            height="50.0537"
            rx="11.661"
            stroke="#737373"
            stroke-opacity="0.3"
            stroke-width="1.014"
          />
        </g>

        <!-- Server Transform Text -->
        <text class="server-text" x="236" y="122">Server transform</text>

        <!-- Definitions -->
        <defs>
          <filter
            id="filter-js-glow"
            x="0"
            y="1.09473"
            width="164"
            height="164"
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
              stdDeviation="15"
              result="effect1_foregroundBlur_1_6"
            />
          </filter>
          <filter
            id="filter-js-bg"
            x="30"
            y="31.0947"
            width="104"
            height="108"
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
            <feMorphology
              radius="3"
              operator="erode"
              in="SourceAlpha"
              result="effect1_innerShadow_1_6"
            />
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="5" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.35 0"
            />
            <feBlend
              mode="normal"
              in2="shape"
              result="effect1_innerShadow_1_6"
            />
          </filter>
          <filter
            id="filter-client"
            x="193"
            y="22"
            width="182"
            height="55.0677"
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
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="2" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
            />
            <feBlend
              mode="normal"
              in2="shape"
              result="effect1_innerShadow_1_6"
            />
          </filter>
          <filter
            id="filter-client-glow"
            x="203"
            y="31.5342"
            width="32"
            height="32"
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
              stdDeviation="5"
              result="effect1_foregroundBlur_1_6"
            />
          </filter>
          <filter
            id="filter-server"
            x="193"
            y="92.2065"
            width="182.416"
            height="55.0677"
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
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="2" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
            />
            <feBlend
              mode="normal"
              in2="shape"
              result="effect1_innerShadow_1_6"
            />
          </filter>
          <filter
            id="filter-server-glow"
            x="203"
            y="101.601"
            width="31.8659"
            height="31.8659"
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
              stdDeviation="5"
              result="effect1_foregroundBlur_1_6"
            />
          </filter>
          <linearGradient
            id="linear-js-glow"
            x1="130"
            y1="144"
            x2="22.5"
            y2="23.5002"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#FFE358" />
            <stop offset="1" stop-color="#FFE358" stop-opacity="0" />
          </linearGradient>
          <linearGradient
            id="linear-js-bg"
            x1="130"
            y1="144"
            x2="22.5"
            y2="23.5002"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#FFE358" />
            <stop offset="1" stop-color="#FFE358" stop-opacity="0" />
          </linearGradient>
          <linearGradient
            id="linear-client-bg"
            x1="193"
            y1="47"
            x2="375"
            y2="47"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#FFE358" />
            <stop offset="1" stop-color="#FFE358" stop-opacity="0" />
          </linearGradient>
          <linearGradient
            id="linear-server-bg"
            x1="193"
            y1="117"
            x2="379"
            y2="117"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#FFE358" />
            <stop offset="1" stop-color="#FFE358" stop-opacity="0" />
          </linearGradient>
          <clipPath id="clip-client">
            <rect
              x="193"
              y="22"
              width="182"
              height="51.0677"
              rx="12.168"
              fill="white"
            />
          </clipPath>
          <clipPath id="clip-server">
            <rect
              x="193"
              y="92.2065"
              width="182.416"
              height="51.0677"
              rx="12.168"
              fill="white"
            />
          </clipPath>
        </defs>
      </svg>
    </div>
    <div class="feature__meta">
      <div class="meta__title">First class SSR Support</div>
      <div class="meta__description">
        It's never been easier to setup custom SSR (Server-Side Rendering), or
        build your own SSR framework.
      </div>
    </div>
  </div>
</template>

<style scoped>
.feature-card {
  @media (min-width: 768px) {
    transform: translate3d(-60px, 0, 0);
  }

  .feature__meta {
    max-width: calc(100%);
  }

  /* Extend height on smaller devices, to make room for text */
  @media (max-width: 380px) {
    height: 400px;
  }
}

.feature__visualization {
  margin-top: 10px;

  svg {
    width: calc(100% - 15px);
    margin: 0 auto;
  }

  .js-text {
    fill: #a3a3a3;
    font-family: Inter, sans-serif;
    font-size: 30px;
    font-weight: 500;
    line-height: normal;
    letter-spacing: -0.5px;
    user-select: none;
    pointer-events: none;
    transition: all 0.3s ease-in-out;
  }

  .connector {
    stroke: #a3a3a3;
    transition: all 0.3s ease-in-out;
  }

  .client__indicator,
  .server__indicator {
    fill: #1e1e1e;
    transition: all 0.1s ease-in-out;
  }

  .client-text,
  .server-text {
    fill: #565656;
    font-family: Inter, sans-serif;
    font-size: 15px;
    font-weight: 400;
    user-select: none;
    pointer-events: none;
    transition: all 0.3s ease-in-out;
  }

  .js__glow {
    opacity: 0;
    transition: all 0.3s ease-in-out;
  }

  .js__bg,
  .client__bg,
  .client__glow,
  .server__bg,
  .server__glow {
    opacity: 0;
    transition: all 0.3s ease-in-out;
  }

  &.active {
    .connector {
      stroke: #ffe358;
      transition-delay: 0.1s;
    }

    .client__indicator,
    .server__indicator {
      fill: #fdefab;
      transition-delay: 0.3s;
    }

    .js-text {
      fill: #171717;
    }

    .js__glow,
    .js__bg,
    .client__bg,
    .client__glow,
    .server__bg,
    .server__glow {
      opacity: 1;
    }

    .client__glow,
    .server__glow,
    .client__bg,
    .server__bg {
      transition-delay: 0.3s;
    }

    .client-text,
    .server-text {
      transition-delay: 0.3s;
      fill: #fafafa;
    }
  }
}
</style>
