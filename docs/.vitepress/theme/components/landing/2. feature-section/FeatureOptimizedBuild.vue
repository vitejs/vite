<script setup lang="ts">
import SvgNode from '../common/SvgNode.vue'
import { ref, Ref } from 'vue'
import { gsap } from 'gsap'
import { useSlideIn } from '../../../composables/useSlideIn'
import { useCardAnimation } from '../../../composables/useCardAnimation'

// Animation state
const isBoltActive: Ref<boolean> = ref(false)
const nodes = Array.from({ length: 10 }, () => {
  return {
    position: ref(0),
    visible: ref(false),
  }
})

/**
 * Slide the card in when the page loads
 */
useSlideIn('#optimized-build-card')

/**
 * Start the animation when the card is hovered
 */
const { startAnimation } = useCardAnimation(
  '#optimized-build-card',
  () => {
    // Define the timeline
    const timeline = gsap.timeline()

    // Animate in each node
    nodes.forEach((node, i) => {
      let subTimeline = gsap.timeline()
      subTimeline.call(() => {
        node.visible.value = true
      })
      subTimeline.to(node.position, {
        value: 1,
        duration: 0.8,
        ease: 'power3.out',
      })
      subTimeline.call(
        () => {
          node.visible.value = false
        },
        null,
        '-=0.6',
      )
      timeline.add(subTimeline, Math.random())
    })

    // Animate in the bolt
    timeline.call(
      () => {
        isBoltActive.value = true
      },
      null,
      '-=0.5',
    )

    // All done
    return timeline
  },
  {
    once: true,
  },
)
</script>

<template>
  <div
    class="feature-card"
    id="optimized-build-card"
    @mouseover.stop.prevent="startAnimation"
  >
    <div class="feature__visualization">
      <!-- Left-side lines/nodes -->
      <svg
        class="left-lines"
        width="195"
        height="138"
        viewBox="0 0 195 138"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M195 31.5L89.8055 30.377C76.1575 30.377 62.535 29.076 49.0906 26.4886L-21 13"
          stroke="url(#ob-linear-gradient-left)"
        />

        <SvgNode
          path="M195 31.5L89.8055 30.377C76.1575 30.377 62.535 29.076 49.0906 26.4886L-21 13"
          :position="nodes[0].position.value"
          :visible="nodes[0].visible.value"
          :dot-color="false"
          glow-color="#FFE358"
        />

        <path
          d="M195 50L69.295 47.754L-21 41.016"
          stroke="url(#ob-linear-gradient-left)"
        />

        <SvgNode
          path="M195 50L69.295 47.754L-21 41.016"
          :position="nodes[1].position.value"
          :visible="nodes[1].visible.value"
          :dot-color="false"
          glow-color="#FFE358"
        />

        <path
          d="M195 68.5L-21 69.5642"
          stroke="url(#ob-linear-gradient-left)"
        />

        <SvgNode
          path="M195 68.5L-21 69.5642"
          :position="nodes[2].position.value"
          :visible="nodes[2].visible.value"
          :dot-color="false"
          glow-color="#FFE358"
        />

        <path
          d="M195 87L69.2951 89.2463L-21 96.1614"
          stroke="url(#ob-linear-gradient-left)"
        />

        <SvgNode
          path="M195 87L69.2951 89.2463L-21 96.1614"
          :position="nodes[3].position.value"
          :visible="nodes[3].visible.value"
          :dot-color="false"
          glow-color="#FFE358"
        />

        <path
          d="M195 105.5L89.8055 106.623C76.1575 106.623 62.535 107.924 49.0906 110.511L-21 124"
          stroke="url(#ob-linear-gradient-left)"
        />

        <SvgNode
          path="M195 105.5L89.8055 106.623C76.1575 106.623 62.535 107.924 49.0906 110.511L-21 124"
          :position="nodes[4].position.value"
          :visible="nodes[4].visible.value"
          :dot-color="false"
          glow-color="#FFE358"
        />

        <defs>
          <linearGradient
            id="ob-linear-gradient-left"
            x1="-453.247"
            y1="167.386"
            x2="196.189"
            y2="125.855"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stop-color="white" stop-opacity="0" />
            <stop offset="0.7" stop-color="white" stop-opacity="0.2" />
            <stop offset="1" stop-color="white" stop-opacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <!-- Right-side lines/nodes -->
      <svg
        class="right-lines"
        width="203"
        height="113"
        viewBox="0 0 203 113"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 93.5L105.194 94.623C118.843 94.623 132.465 95.924 145.909 98.5114L216 112"
          stroke="url(#ob-linear-gradient-right)"
        />

        <SvgNode
          path="M0 93.5L105.194 94.623C118.843 94.623 132.465 95.924 145.909 98.5114L216 112"
          :position="nodes[5].position.value"
          :visible="nodes[5].visible.value"
          :dot-color="false"
          glow-color="#FFE358"
        />

        <path
          d="M0 75L125.705 77.246L216 83.984"
          stroke="url(#ob-linear-gradient-right)"
        />

        <SvgNode
          path="M0 75L125.705 77.246L216 83.984"
          :position="nodes[6].position.value"
          :visible="nodes[6].visible.value"
          :dot-color="false"
          glow-color="#FFE358"
        />

        <path
          d="M4.65162e-08 56.5L216 55.4358"
          stroke="url(#ob-linear-gradient-right)"
        />

        <SvgNode
          path="M4.65162e-08 56.5L216 55.4358"
          :position="nodes[7].position.value"
          :visible="nodes[7].visible.value"
          :dot-color="false"
          glow-color="#FFE358"
        />

        <path
          d="M4.00455e-07 38L125.705 35.7537L216 28.8386"
          stroke="url(#ob-linear-gradient-right)"
        />

        <SvgNode
          path="M4.00455e-07 38L125.705 35.7537L216 28.8386"
          :position="nodes[8].position.value"
          :visible="nodes[8].visible.value"
          :dot-color="false"
          glow-color="#FFE358"
        />

        <path
          d="M8.0866e-07 19.5L105.194 18.377C118.843 18.377 132.465 17.076 145.909 14.4887L216 1"
          stroke="url(#ob-linear-gradient-right)"
        />

        <SvgNode
          path="M8.0866e-07 19.5L105.194 18.377C118.843 18.377 132.465 17.076 145.909 14.4887L216 1"
          :position="nodes[9].position.value"
          :visible="nodes[9].visible.value"
          :dot-color="false"
          glow-color="#FFE358"
        />

        <defs>
          <linearGradient
            id="ob-linear-gradient-right"
            x1="648.247"
            y1="-42.3859"
            x2="-1.18927"
            y2="-0.855247"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stop-color="white" stop-opacity="0" />
            <stop offset="0.7" stop-color="white" stop-opacity="0.2" />
            <stop offset="1" stop-color="white" stop-opacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <!-- Lightning Bolt -->
      <svg
        class="bolt"
        :class="{ active: isBoltActive }"
        width="180"
        height="263"
        viewBox="0 0 180 263"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter="url(#filter-bolt-glow)" class="bolt__glow">
          <path
            d="M111.597 57.0439L61.562 69.1637C60.7396 69.3629 60.1308 70.2245 60.0812 71.2584L57.0033 135.519C56.9309 137.032 58.0553 138.207 59.2503 137.866L73.1807 133.892C74.4841 133.521 75.6618 134.94 75.3939 136.56L71.2552 161.613C70.9767 163.3 72.2573 164.741 73.5893 164.241L82.1934 161.01C83.5273 160.509 84.8089 161.955 84.5267 163.643L77.9496 202.996C77.538 205.458 80.1867 206.8 81.2913 204.689L82.0291 203.28L122.8 102.695C123.483 101.011 122.306 99.0908 120.809 99.4478L106.47 102.869C105.123 103.19 103.976 101.639 104.357 100.009L113.715 59.9023C114.096 58.2698 112.946 56.7172 111.597 57.0439Z"
            fill="url(#paint0_radial_693_18989)"
          />
        </g>
        <g filter="url(#filter-bolt-edge-glow)" class="bolt__glow">
          <path
            d="M111.597 57.0361L61.562 67.0126C60.7396 67.1765 60.1308 67.8857 60.0812 68.7368L57.0033 121.633C56.9309 122.879 58.0553 123.846 59.2503 123.565L73.1807 120.294C74.4841 119.988 75.6618 121.156 75.3939 122.49L71.2552 143.113C70.9767 144.501 72.2573 145.688 73.5893 145.276L82.1934 142.616C83.5273 142.204 84.8089 143.394 84.5267 144.783L77.9496 177.177C77.538 179.203 80.1867 180.308 81.2913 178.571L82.0291 177.41L122.8 94.6142C123.483 93.2278 122.306 91.6471 120.809 91.9409L106.47 94.757C105.123 95.0214 103.976 93.7444 104.357 92.4029L113.715 59.389C114.096 58.0452 112.946 56.7672 111.597 57.0361Z"
            stroke="url(#paint1_radial_693_18989)"
            stroke-width="3.34777"
          />
        </g>

        <mask
          id="bolt-mask"
          style="mask-type: alpha"
          maskUnits="userSpaceOnUse"
          x="56"
          y="56"
          width="68"
          height="124"
        >
          <path
            d="M111.597 57.0361L61.562 67.0126C60.7396 67.1765 60.1308 67.8857 60.0812 68.7368L57.0033 121.633C56.9309 122.879 58.0553 123.846 59.2503 123.565L73.1807 120.294C74.4841 119.988 75.6618 121.156 75.3939 122.49L71.2552 143.113C70.9767 144.501 72.2573 145.688 73.5893 145.276L82.1934 142.616C83.5273 142.204 84.8089 143.394 84.5267 144.783L77.9496 177.177C77.538 179.203 80.1867 180.308 81.2913 178.571L82.0291 177.41L122.8 94.6142C123.483 93.2278 122.306 91.6471 120.809 91.9409L106.47 94.757C105.123 95.0214 103.976 93.7444 104.357 92.4029L113.715 59.389C114.096 58.0452 112.946 56.7672 111.597 57.0361Z"
            fill="url(#linear-mask)"
          />
          <path
            d="M59.8424 68.7229L59.8424 68.7229L56.7646 121.619L57.0033 121.633L56.7646 121.619C56.6833 123.019 57.9486 124.116 59.305 123.798L73.2353 120.527C74.3622 120.262 75.3945 121.273 75.1595 122.443L75.3939 122.49L75.1595 122.443L71.0208 143.066C70.7081 144.624 72.147 145.972 73.6599 145.504L73.5893 145.276L73.6599 145.504L82.264 142.844C83.4168 142.488 84.54 143.516 84.2924 144.735L84.5267 144.783L84.2924 144.735L77.7152 177.129C77.255 179.395 80.235 180.678 81.4931 178.699L82.2309 177.539L82.2379 177.528L82.2436 177.516L123.015 94.7198C123.781 93.1646 122.463 91.3725 120.763 91.7063L106.424 94.5223C106.424 94.5223 106.424 94.5224 106.424 94.5224C105.259 94.7509 104.253 93.6453 104.587 92.4681L113.946 59.4542L113.946 59.4542C114.373 57.9459 113.082 56.4962 111.55 56.8016L111.597 57.0361L111.55 56.8016L61.5153 66.7781C60.5836 66.9638 59.8982 67.7658 59.8424 68.7229Z"
            stroke="white"
            stroke-opacity="0.3"
            stroke-width="0.478253"
          />
        </mask>
        <g mask="url(#bolt-mask)">
          <rect
            class="bolt__dark"
            x="41.2188"
            y="57"
            width="92.7811"
            height="136.78"
            fill="#1E1E1E"
          />
          <rect
            class="bolt__color"
            x="41.2188"
            y="57"
            width="92.7811"
            height="136.78"
            fill="url(#radial-bolt-color)"
          />
          <rect
            class="bolt__highlight"
            x="41.2188"
            y="57"
            width="92.7811"
            height="136.78"
            fill="white"
          />
          <path
            class="bolt__edge"
            d="M111.597 57.0361L61.562 67.0126C60.7396 67.1765 60.1308 67.8857 60.0812 68.7368L57.0033 121.633C56.9309 122.879 58.0553 123.846 59.2503 123.565L73.1807 120.294C74.4841 119.988 75.6618 121.156 75.3939 122.49L71.2552 143.113C70.9767 144.501 72.2573 145.688 73.5893 145.276L82.1934 142.616C83.5273 142.204 84.8089 143.394 84.5267 144.783L77.9496 177.177C77.538 179.203 80.1867 180.308 81.2913 178.571L82.0291 177.41L122.8 94.6142C123.483 93.2278 122.306 91.6471 120.809 91.9409L106.47 94.757C105.123 95.0214 103.976 93.7444 104.357 92.4029L113.715 59.389C114.096 58.0452 112.946 56.7672 111.597 57.0361Z"
            stroke="url(#radial-bolt-edge)"
            stroke-width="3"
          />
        </g>
        <defs>
          <filter
            id="filter-bolt-glow"
            x="0.0878601"
            y="0.0878601"
            width="179.823"
            height="262.561"
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
              stdDeviation="28.4561"
              result="effect1_foregroundBlur_693_18989"
            />
          </filter>
          <filter
            id="filter-bolt-edge-glow"
            x="48.6306"
            y="48.6283"
            width="82.7363"
            height="139.202"
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
              stdDeviation="3.34777"
              result="effect1_foregroundBlur_693_18989"
            />
          </filter>
          <radialGradient
            id="paint0_radial_693_18989"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(79.4533 63.5007) rotate(81.9567) scale(108.196 88.8357)"
          >
            <stop offset="0" stop-color="#FFEA83" />
            <stop offset="0.0833333" stop-color="#FFDD35" />
            <stop offset="1" stop-color="#FFA800" />
          </radialGradient>
          <radialGradient
            id="paint1_radial_693_18989"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(79.4533 62.3511) rotate(80.2589) scale(89.4759 88.4248)"
          >
            <stop offset="0" stop-color="#FFEA83" />
            <stop offset="0.0833333" stop-color="#FFDD35" />
            <stop offset="1" stop-color="#FFA800" />
          </radialGradient>
          <linearGradient
            id="linear-mask"
            x1="75.4703"
            y1="59.7447"
            x2="91.2207"
            y2="165.923"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stop-color="#FFEA83" />
            <stop offset="0.0833333" stop-color="#FFDD35" />
            <stop offset="1" stop-color="#FFA800" />
          </linearGradient>
          <radialGradient
            id="radial-bolt-color"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(72.7835 62.9782) rotate(77.8103) scale(100.793 123.282)"
          >
            <stop offset="0" stop-color="#FFEA83" />
            <stop offset="0.0833333" stop-color="#FFDD35" />
            <stop offset="1" stop-color="#FFA800" />
          </radialGradient>
          <radialGradient
            id="radial-bolt-edge"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(79.4533 62.3511) rotate(80.2589) scale(89.4759 88.4248)"
          >
            <stop offset="0" stop-color="#FFDD35" />
            <stop offset="1" stop-color="#FFA800" />
          </radialGradient>
        </defs>
      </svg>
    </div>
    <div class="feature__meta meta--center">
      <div class="meta__title">Optimized build</div>
      <div class="meta__description">
        Pre-configured Rollup build with multi-page and library mode support.
      </div>
    </div>
  </div>
</template>

<style scoped>
.feature-card {
  min-height: 370px;

  @media (min-width: 768px) {
    transform: translate3d(60px, 0, 0);
  }
}

.feature__visualization {
  .left-lines {
    position: absolute;
    top: 60px;
    left: unset;
    right: 50%;

    @media (min-width: 455px) {
      left: 0;
      right: unset;
    }

    @media (min-width: 768px) {
      left: unset;
      right: 50%;
    }

    @media (min-width: 900px) {
      left: 0;
      right: unset;
    }

    @media (min-width: 1200px) {
      left: unset;
      right: 50%;
    }
  }

  .right-lines {
    position: absolute;
    top: 71px;
    right: unset;
    left: 50%;

    @media (min-width: 455px) {
      right: 0;
      left: unset;
    }

    @media (min-width: 768px) {
      right: unset;
      left: 50%;
    }

    @media (min-width: 900px) {
      right: 0;
      left: unset;
    }

    @media (min-width: 1200px) {
      right: unset;
      left: 50%;
    }
  }

  .bolt {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translate3d(-50%, 0, 0);

    .bolt__glow {
      transition: opacity 0.3s ease;
      will-change: opacity;
      opacity: 0.6;
    }

    .bolt__color {
      opacity: 0.03;
    }

    .bolt__edge {
      opacity: 0.1;
    }

    .bolt__highlight {
      opacity: 0;
    }

    &.active {
      .bolt__color {
        animation: bolt-color-entrance 0.5s ease forwards;
      }

      .bolt__edge {
        animation: bolt-edge-entrance 0.5s ease forwards;
      }

      .bolt__glow {
        opacity: 0.7;
        transition: opacity 0.1s ease;
      }

      .bolt__highlight {
        opacity: 0.6;
        transition: opacity 0.1s ease;
        transition-delay: 0.5s;
      }
    }
  }
}

@keyframes bolt-edge-entrance {
  0% {
    opacity: 0;
  }
  2% {
    opacity: 0.6;
  }
  30% {
    opacity: 0.6;
  }
  31% {
    opacity: 0.01;
  }
  35% {
    opacity: 0.01;
  }
  36% {
    opacity: 0.8;
  }
  80% {
    opacity: 0.8;
  }
  80% {
    opacity: 0.3;
  }
  82% {
    opacity: 1;
  }
  100% {
    opacity: 1;
  }
}

@keyframes bolt-color-entrance {
  0% {
    opacity: 0.03;
  }
  2% {
    opacity: 0.4;
  }
  30% {
    opacity: 0.4;
  }
  31% {
    opacity: 0.01;
  }
  35% {
    opacity: 0.01;
  }
  36% {
    opacity: 0.45;
  }
  80% {
    opacity: 0.45;
  }
  80% {
    opacity: 0.3;
  }
  82% {
    opacity: 0.5;
  }
  100% {
    opacity: 0.9;
  }
}
</style>
