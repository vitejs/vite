<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'
import { useSlideIn } from '../../../composables/useSlideIn'
import { useCardAnimation } from '../../../composables/useCardAnimation'

// Animation state
const commandTriggered = ref(false)
const highlightEnter = ref(true)

/**
 * Slide the card in when the page loads
 */
useSlideIn('#instant-server-start-card')

/**
 * Start the animation when the card is hovered
 */
const { startAnimation } = useCardAnimation(
  '#instant-server-start-card',
  () => {
    const timeline = gsap.timeline()

    // Execute the `npm run dev` command
    timeline.call(() => {
      commandTriggered.value = true
      highlightEnter.value = false
    })
    return timeline
  },
  {
    once: true,
  },
)

/**
 * Run the command animation on enter press
 */
function handleEnterPress(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    startAnimation()
    window.removeEventListener('keydown', handleEnterPress)
  }
}

/**
 * Listen for enter key presses
 */
onMounted(() => {
  window.addEventListener('keydown', handleEnterPress)
})

/**
 * Clean up when unmounting the component.
 */
onUnmounted(() => {
  window.removeEventListener('keydown', handleEnterPress)
})
</script>

<template>
  <div
    id="instant-server-start-card"
    class="feature-card"
    @mouseover.stop.prevent="startAnimation"
  >
    <div class="feature__visualization">
      <div class="terminal" :class="{ 'terminal--active': commandTriggered }">
        <div class="terminal__skeleton-line" />
        <div class="terminal__skeleton-line" />
        <Transition name="command-transition">
          <svg
            class="terminal__command"
            width="110"
            height="15"
            viewBox="0 0 110 15"
            v-show="!commandTriggered"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0.253655 10.368L5.48951 7.40346V7.28547L0.253655 4.32095V3.06729L6.59567 6.73976V7.91967L0.253655 11.5921V10.368ZM17.5426 11.8281V4.2177H18.7225V5.45661H18.7815C18.8601 5.26979 18.9585 5.0928 19.0765 4.92565C19.1944 4.74866 19.337 4.59626 19.5042 4.46843C19.6812 4.34061 19.8876 4.23737 20.1236 4.15871C20.3596 4.08005 20.6349 4.04072 20.9496 4.04072C21.746 4.04072 22.3851 4.29636 22.8669 4.80766C23.3487 5.30912 23.5896 6.02198 23.5896 6.94625V11.8281H22.4097V7.15273C22.4097 6.45462 22.2573 5.93841 21.9525 5.6041C21.6477 5.25996 21.2003 5.08789 20.6103 5.08789C20.3744 5.08789 20.1433 5.11738 19.9171 5.17638C19.691 5.23538 19.4894 5.32387 19.3124 5.44186C19.1354 5.55985 18.9929 5.71226 18.8847 5.89908C18.7766 6.08589 18.7225 6.30221 18.7225 6.54803V11.8281H17.5426ZM26.0469 4.2177H27.2268V5.45661H27.2858C27.7774 4.51268 28.5591 4.04072 29.6309 4.04072C30.565 4.04072 31.2926 4.38977 31.8137 5.08789C32.3447 5.786 32.6102 6.76434 32.6102 8.02291C32.6102 9.28148 32.3447 10.2598 31.8137 10.9579C31.2926 11.6561 30.565 12.0051 29.6309 12.0051C28.5591 12.0051 27.7774 11.5331 27.2858 10.5892H27.2268V14.7779H26.0469V4.2177ZM29.1737 10.9579C29.862 10.9579 30.3929 10.7515 30.7666 10.3385C31.15 9.91569 31.3418 9.36015 31.3418 8.67186V7.37396C31.3418 6.68568 31.15 6.13506 30.7666 5.72209C30.3929 5.29929 29.862 5.08789 29.1737 5.08789C28.9082 5.08789 28.6575 5.1223 28.4215 5.19113C28.1855 5.25996 27.979 5.3632 27.802 5.50086C27.625 5.62868 27.4825 5.79092 27.3743 5.98757C27.276 6.17439 27.2268 6.39562 27.2268 6.65127V9.39456C27.2268 9.65021 27.276 9.87636 27.3743 10.073C27.4825 10.2598 27.625 10.4221 27.802 10.5597C27.979 10.6875 28.1855 10.7859 28.4215 10.8547C28.6575 10.9235 28.9082 10.9579 29.1737 10.9579ZM33.9908 11.8281V4.2177H35.0822V5.10264H35.1412C35.2592 4.80766 35.4264 4.55693 35.6427 4.35044C35.859 4.14396 36.1785 4.04072 36.6013 4.04072C37.0438 4.04072 37.3732 4.15379 37.5895 4.37994C37.8058 4.59626 37.9386 4.8814 37.9877 5.23538H38.032C38.1696 4.89124 38.3663 4.60609 38.6219 4.37994C38.8776 4.15379 39.2316 4.04072 39.6839 4.04072C40.3033 4.04072 40.7163 4.25703 40.9228 4.68967C41.1391 5.1223 41.2472 5.74175 41.2472 6.54803V11.8281H40.1558V6.73976C40.1558 6.09081 40.087 5.64343 39.9493 5.39761C39.8215 5.14197 39.5806 5.01414 39.2266 5.01414C38.912 5.01414 38.6564 5.11738 38.4597 5.32387C38.2631 5.52052 38.1647 5.82533 38.1647 6.2383V11.8281H37.0733V6.73976C37.0733 6.09081 37.0045 5.64343 36.8668 5.39761C36.739 5.14197 36.503 5.01414 36.1589 5.01414C35.8442 5.01414 35.5837 5.11738 35.3772 5.32387C35.1805 5.52052 35.0822 5.82533 35.0822 6.2383V11.8281H33.9908ZM51.4272 10.8252H53.6543V5.22063H51.4272V4.2177H54.8342V6.13506H54.9079C55.0653 5.53527 55.3602 5.06822 55.7929 4.73391C56.2353 4.38977 56.7958 4.2177 57.4742 4.2177H58.5362V5.39761H57.1055C56.4271 5.39761 55.8764 5.59426 55.4536 5.98757C55.0407 6.38087 54.8342 6.89708 54.8342 7.5362V10.8252H57.784V11.8281H51.4272V10.8252ZM65.0641 10.5892H65.0052C64.9265 10.776 64.8282 10.9579 64.7102 11.1349C64.5922 11.3021 64.4447 11.4496 64.2677 11.5774C64.1006 11.7052 63.899 11.8085 63.663 11.8871C63.427 11.9658 63.1517 12.0051 62.8371 12.0051C62.0406 12.0051 61.4015 11.7544 60.9197 11.2529C60.4379 10.7416 60.197 10.0238 60.197 9.09958V4.2177H61.3769V8.8931C61.3769 9.59121 61.5293 10.1123 61.8341 10.4565C62.139 10.7908 62.5863 10.9579 63.1763 10.9579C63.4123 10.9579 63.6433 10.9284 63.8695 10.8694C64.0956 10.8105 64.2972 10.722 64.4742 10.604C64.6512 10.486 64.7937 10.3385 64.9019 10.1615C65.0101 9.97468 65.0641 9.75345 65.0641 9.4978V4.2177H66.2441V11.8281H65.0641V10.5892ZM68.8341 11.8281V4.2177H70.014V5.45661H70.073C70.1517 5.26979 70.25 5.0928 70.368 4.92565C70.486 4.74866 70.6285 4.59626 70.7957 4.46843C70.9727 4.34061 71.1792 4.23737 71.4152 4.15871C71.6511 4.08005 71.9264 4.04072 72.2411 4.04072C73.0375 4.04072 73.6766 4.29636 74.1584 4.80766C74.6402 5.30912 74.8811 6.02198 74.8811 6.94625V11.8281H73.7012V7.15273C73.7012 6.45462 73.5488 5.93841 73.244 5.6041C72.9392 5.25996 72.4918 5.08789 71.9019 5.08789C71.6659 5.08789 71.4348 5.11738 71.2087 5.17638C70.9825 5.23538 70.781 5.32387 70.604 5.44186C70.427 5.55985 70.2844 5.71226 70.1762 5.89908C70.0681 6.08589 70.014 6.30221 70.014 6.54803V11.8281H68.8341ZM90.7542 10.5892H90.6952C90.2035 11.5331 89.4218 12.0051 88.3501 12.0051C87.416 12.0051 86.6835 11.6561 86.1525 10.9579C85.6314 10.2598 85.3708 9.28148 85.3708 8.02291C85.3708 6.76434 85.6314 5.786 86.1525 5.08789C86.6835 4.38977 87.416 4.04072 88.3501 4.04072C89.4218 4.04072 90.2035 4.51268 90.6952 5.45661H90.7542V0.913954H91.9341V11.8281H90.7542V10.5892ZM88.8073 10.9579C89.0728 10.9579 89.3235 10.9235 89.5595 10.8547C89.7955 10.7859 90.002 10.6875 90.179 10.5597C90.3559 10.4221 90.4936 10.2598 90.5919 10.073C90.7001 9.87636 90.7542 9.65021 90.7542 9.39456V6.65127C90.7542 6.39562 90.7001 6.17439 90.5919 5.98757C90.4936 5.79092 90.3559 5.62868 90.179 5.50086C90.002 5.3632 89.7955 5.25996 89.5595 5.19113C89.3235 5.1223 89.0728 5.08789 88.8073 5.08789C88.119 5.08789 87.5832 5.29929 87.1997 5.72209C86.826 6.13506 86.6392 6.68568 86.6392 7.37396V8.67186C86.6392 9.36015 86.826 9.91569 87.1997 10.3385C87.5832 10.7515 88.119 10.9579 88.8073 10.9579ZM97.5919 12.0051C97.0412 12.0051 96.5447 11.9117 96.1022 11.7249C95.6696 11.5381 95.296 11.2726 94.9813 10.9284C94.6765 10.5745 94.4405 10.1566 94.2734 9.67479C94.1062 9.18316 94.0226 8.63745 94.0226 8.03766C94.0226 7.42804 94.1062 6.87742 94.2734 6.38579C94.4504 5.89416 94.6913 5.47627 94.9961 5.13213C95.3009 4.77816 95.6647 4.50776 96.0875 4.32095C96.5201 4.13413 96.997 4.04072 97.5181 4.04072C98.0294 4.04072 98.4916 4.13413 98.9045 4.32095C99.3273 4.50776 99.6862 4.76833 99.9812 5.10264C100.276 5.42711 100.502 5.8155 100.66 6.2678C100.817 6.7201 100.896 7.21664 100.896 7.75743V8.31789H95.2616V8.67186C95.2616 9.00617 95.3156 9.3159 95.4238 9.60104C95.5319 9.88619 95.6844 10.132 95.881 10.3385C96.0875 10.545 96.3333 10.7072 96.6184 10.8252C96.9134 10.9334 97.2379 10.9874 97.5919 10.9874C98.1032 10.9874 98.5456 10.8694 98.9193 10.6335C99.2929 10.3975 99.5781 10.073 99.7747 9.66004L100.645 10.25C100.419 10.7613 100.04 11.1841 99.5092 11.5184C98.9881 11.8429 98.349 12.0051 97.5919 12.0051ZM97.5181 5.01414C97.1937 5.01414 96.8938 5.07314 96.6184 5.19113C96.3431 5.30912 96.1022 5.47136 95.8958 5.67784C95.6991 5.88433 95.5418 6.13014 95.4238 6.41529C95.3156 6.6906 95.2616 6.99541 95.2616 7.32972V7.43296H99.6272V7.27072C99.6272 6.93641 99.5731 6.6316 99.465 6.35629C99.3667 6.08098 99.2241 5.845 99.0373 5.64834C98.8603 5.44186 98.639 5.28454 98.3736 5.17638C98.1179 5.06822 97.8328 5.01414 97.5181 5.01414ZM105.256 11.8281L102.527 4.2177H103.722L104.813 7.40346L105.993 10.84H106.052L107.232 7.40346L108.323 4.2177H109.488L106.76 11.8281H105.256Z"
              fill="white"
            />
          </svg>
        </Transition>
        <Transition name="command-transition">
          <svg
            class="terminal__enter"
            width="28"
            height="28"
            viewBox="0 0 28 28"
            v-show="!commandTriggered"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              width="28"
              height="28"
              rx="4"
              fill="url(#paint0_linear_693_14840)"
            />
            <rect
              width="28"
              height="28"
              rx="4"
              fill="url(#paint1_linear_693_14840)"
            />
            <rect
              x="0.5"
              y="0.5"
              width="27"
              height="27"
              rx="3.92105"
              stroke="white"
              stroke-opacity="0.1"
            />
            <g filter="url(#filter0_f_693_14840)">
              <path
                d="M19.9999 8V14.75C19.9999 15.5456 19.6839 16.3087 19.1213 16.8713C18.5586 17.4339 17.7956 17.75 16.9999 17.75H10.1854L12.0604 19.625L10.9999 20.6855L7.31445 17L10.9999 13.3145L12.0604 14.375L10.1854 16.25H16.9999C17.3978 16.25 17.7793 16.092 18.0606 15.8106C18.3419 15.5293 18.4999 15.1478 18.4999 14.75V8H19.9999Z"
                fill="#FAFAFA"
              />
            </g>
            <path
              d="M19.9999 8V14.75C19.9999 15.5456 19.6839 16.3087 19.1213 16.8713C18.5586 17.4339 17.7956 17.75 16.9999 17.75H10.1854L12.0604 19.625L10.9999 20.6855L7.31445 17L10.9999 13.3145L12.0604 14.375L10.1854 16.25H16.9999C17.3978 16.25 17.7793 16.092 18.0606 15.8106C18.3419 15.5293 18.4999 15.1478 18.4999 14.75V8H19.9999Z"
              fill="#FAFAFA"
            />
            <defs>
              <filter
                id="filter0_f_693_14840"
                x="1.31445"
                y="2"
                width="24.6855"
                height="24.6855"
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
                  stdDeviation="3"
                  result="effect1_foregroundBlur_693_14840"
                />
              </filter>
              <linearGradient
                id="paint0_linear_693_14840"
                x1="14"
                y1="0"
                x2="14"
                y2="28"
                gradientUnits="userSpaceOnUse"
              >
                <stop stop-color="#404040" />
                <stop offset="1" stop-color="#262626" />
              </linearGradient>
              <linearGradient
                id="paint1_linear_693_14840"
                x1="14"
                y1="0"
                x2="14"
                y2="28"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stop-color="#404040" />
                <stop offset="1" stop-color="#262626" />
              </linearGradient>
            </defs>
          </svg>
        </Transition>
        <div class="terminal__enter-pulse" v-show="highlightEnter" />
        <Transition name="ready-label-transition">
          <span class="terminal__ready-label" v-if="commandTriggered"
            >Ready in 96ms</span
          >
        </Transition>
        <div class="terminal__glow" />
      </div>
      <div class="connection-line" :class="{ active: commandTriggered }" />
    </div>
    <div class="feature__meta">
      <div class="meta__title">Instant server start</div>
      <div class="meta__description">
        On demand file serving over native ESM, no bundling required!
      </div>
    </div>
  </div>
</template>

<style scoped>
.feature-card {
  perspective: 100px;

  @media (min-width: 768px) {
    transform: translate3d(-60px, 0, 0);
  }

  /* Extend height on smaller devices, to make room for text */
  @media (max-width: 420px) {
    height: 400px;
  }

  /* Or for really small screen */
  @media (max-width: 340px) {
    height: 420px;
  }

  .feature__meta {
    max-width: calc(100% - 30px);
  }
}

.feature__visualization {
  .terminal {
    position: absolute;
    top: 33px;
    left: 32px;
    right: 0;
    height: 170px;
    border-radius: 12px 0 0 12px;
    background: #171717;
    overflow: hidden;
    transition: all 0.4s ease-in-out;
    border: 1px solid transparent;
    border-right: none;

    .command-transition-enter-active,
    .command-transition-leave-active,
    .ready-label-transition-enter-active,
    .ready-label-transition-leave-active {
      transition: all 0.4s ease;
    }

    .command-transition-enter-active {
      transition: all 1s ease;
      transition-delay: 0.5s;
    }

    .ready-label-transition-enter-active {
      transition-delay: 0.2s;
    }

    .ready-label-transition-leave-active {
      transition: all 0.6s ease;
    }

    .command-transition-enter-from,
    .command-transition-leave-to {
      opacity: 0;
    }

    .ready-label-transition-enter-from,
    .ready-label-transition-leave-to {
      transform: translate3d(0, -20px, 0);
      opacity: 0;
    }

    * {
      user-select: none;
    }

    .terminal__skeleton-line {
      height: 10px;
      border-radius: 20px;
      opacity: 0.6;
      background: #404040;
      position: absolute;
      left: 32px;

      &:nth-child(1) {
        top: 33px;
        width: 45%;
        max-width: 170px;
      }

      &:nth-child(2) {
        top: 64px;
        width: 60%;
        max-width: 230px;
      }
    }

    .terminal__command {
      position: absolute;
      left: 32px;
      top: 100px;
      margin-bottom: 0;
      border-right: 1px solid white;
      animation: cursor-blink 1s linear infinite;
    }

    .terminal__enter {
      position: absolute;
      top: 93px;
      left: 165px;
      border-radius: 2px;
    }

    .terminal__enter-pulse {
      width: 28px;
      height: 28px;
      position: absolute;
      top: 93px;
      left: 165px;
      border-radius: 5px;
      pointer-events: none;
      border: 1px solid white;
      opacity: 0;
      box-shadow: 0 0 5px 0 rgb(255, 255, 255);
      animation: enter-pulse 4s ease-out infinite;
    }

    .terminal__ready-label {
      font-family: Inter, sans-serif;
      font-size: 22px;
      font-style: normal;
      font-weight: 600;
      line-height: normal;
      letter-spacing: -0.4px;
      background: linear-gradient(
        to left,
        #13b351 0%,
        rgba(19, 179, 81, 0.7) 120%
      );
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      position: absolute;
      left: 32px;
      top: 110px;
      pointer-events: none;
    }

    .terminal__glow {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      height: 100%;
      border-radius: 12px 0 0 12px;
      background:
        url('../common/noise.webp'),
        radial-gradient(
          ellipse 140% 80% at 96% bottom,
          #13b351 0%,
          transparent 50%
        );
      filter: blur(15px);
      opacity: 0;
      pointer-events: none;
      will-change: opacity, transform;
      transition: all 2s ease-in-out;

      @media (min-width: 768px) {
        transform: translate3d(60px, 0, 0);
      }
    }

    &.terminal--active {
      border: 1px solid #13b351;
      border-right: none;
      box-shadow: 0 0 11px 0 rgba(19, 179, 81, 0.3);
      transition-delay: 0.2s;

      .terminal__glow {
        transition: all 0.6s ease-in-out;
        transform: translate3d(0, 20px, 0);
        opacity: 1;
      }
    }
  }

  .connection-line {
    position: absolute;
    top: 203px;
    right: 40px;
    width: 1px;
    height: calc(100% - 170px - 33px);
    background: url('../common/noise.webp'), #13b351;
    box-shadow: 0 0 10px 0 #13b351;
    transition: all 0.5s ease-in;
    will-change: transform, opacity;
    opacity: 0.5;
    transform-origin: center bottom;
    transform: scaleY(0);
    visibility: hidden;

    &.active {
      transition: all 0.3s ease-out;
      visibility: visible;
      opacity: 1;
      transform: scaleY(1);
    }
  }
}

@keyframes enter-pulse {
  0% {
    transform: scale(1) translate3d(0, 0, 0);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.6) translate3d(0, 0, 0);
    opacity: 0;
  }
}

@keyframes cursor-blink {
  0% {
    border-color: transparent;
  }
  49% {
    border-color: transparent;
  }
  50% {
    border-color: #ffffff;
  }
  100% {
    border-color: #ffffff;
  }
}
</style>
