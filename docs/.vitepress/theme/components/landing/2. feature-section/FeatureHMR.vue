<script setup>
import { ref } from 'vue'
import { gsap } from 'gsap'
import { useSlideIn } from '../../../composables/useSlideIn'
import { useCardAnimation } from '../../../composables/useCardAnimation'

// Animation state
const terminalActive = ref(false)
const connectionsActive = ref(false)
const browserActive = ref(false)

/**
 * Slide the card in when the page loads
 */
useSlideIn('#hmr-card')

/**
 * Start the animation when the card is hovered
 */
const { startAnimation } = useCardAnimation(
  '#hmr-card',
  () => {
    // Define the timeline
    const timeline = gsap.timeline()

    // Animate in the components, one at a time
    timeline.call(
      () => {
        terminalActive.value = true
      },
      null,
      0,
    )
    timeline.call(
      () => {
        connectionsActive.value = true
      },
      null,
      0.4,
    )
    timeline.call(
      () => {
        browserActive.value = true
      },
      null,
      1,
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
    id="hmr-card"
    @mouseover.stop.prevent="startAnimation"
  >
    <div class="feature__visualization">
      <!-- Terminal / IDE (left-side) -->
      <div class="terminal" :class="{ active: terminalActive }">
        <svg
          class="terminal__line-numbers"
          width="8"
          height="125"
          viewBox="0 0 8 121"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.06038 0.274872V10.2565H3.80614V1.63363L1.44697 3.06705L0.901974 2.17117L3.96292 0.274872H5.06038ZM7.21051 9.53237V10.5552H1.27526V9.53237H7.21051ZM3.50751 22.1106C4.15454 22.1106 4.70701 22.2351 5.1649 22.4839C5.62778 22.7328 5.98364 23.0737 6.2325 23.5067C6.48136 23.9397 6.60579 24.43 6.60579 24.9775C6.60579 25.4503 6.52367 25.9132 6.35942 26.3661C6.19517 26.814 5.93138 27.2869 5.56805 27.7846C5.2097 28.2773 4.73687 28.8248 4.14956 29.427C3.56724 30.0293 2.85053 30.7161 1.99944 31.4876H6.84469L6.68791 32.5552H0.573482V31.5324C1.34992 30.7908 2.00939 30.1413 2.5519 29.5838C3.09939 29.0264 3.54982 28.5386 3.9032 28.1205C4.26155 27.6975 4.54027 27.3142 4.73936 26.9708C4.94342 26.6274 5.08527 26.3014 5.1649 25.9928C5.24454 25.6792 5.28435 25.3557 5.28435 25.0223C5.28435 24.4449 5.12011 23.9895 4.79162 23.656C4.4681 23.3226 4.02016 23.1558 3.44779 23.1558C2.94012 23.1558 2.52452 23.2429 2.20101 23.4171C1.8775 23.5913 1.55398 23.87 1.23047 24.2533L0.364442 23.5814C0.772568 23.0837 1.22549 22.7154 1.7232 22.4764C2.22092 22.2326 2.81569 22.1106 3.50751 22.1106ZM3.49258 44.1106C4.13961 44.1106 4.69705 44.2276 5.1649 44.4615C5.63773 44.6905 6.00355 45.0015 6.26236 45.3947C6.52118 45.7829 6.65058 46.211 6.65058 46.6788C6.65058 47.0919 6.55851 47.4677 6.37435 47.8062C6.1902 48.1446 5.94632 48.4233 5.64271 48.6423C5.3391 48.8613 5.00563 49.0057 4.6423 49.0753C5.04545 49.1052 5.42371 49.2197 5.77709 49.4188C6.13047 49.6129 6.41914 49.8916 6.64312 50.2549C6.86709 50.6133 6.97907 51.0587 6.97907 51.5913C6.97907 52.1836 6.82976 52.7186 6.53113 53.1964C6.2325 53.6692 5.81442 54.0425 5.27689 54.3163C4.74433 54.59 4.12219 54.7269 3.41046 54.7269C2.83809 54.7269 2.26571 54.6174 1.69334 54.3984C1.12595 54.1794 0.645651 53.831 0.252456 53.3532L1.09608 52.6663C1.38973 53.0098 1.73814 53.2661 2.14128 53.4353C2.54941 53.6045 2.96251 53.6892 3.38059 53.6892C4.0973 53.6892 4.65723 53.5025 5.06038 53.1292C5.46353 52.751 5.66511 52.2383 5.66511 51.5913C5.66511 51.1035 5.57054 50.7178 5.38141 50.4341C5.19725 50.1504 4.94591 49.9488 4.62737 49.8294C4.30883 49.7049 3.9455 49.6427 3.53738 49.6427H2.67135L2.82813 48.6498H3.43285C3.76632 48.6498 4.07988 48.5876 4.37354 48.4631C4.67217 48.3337 4.91605 48.1347 5.10518 47.8659C5.29431 47.5971 5.38887 47.2612 5.38887 46.858C5.38887 46.2906 5.19974 45.8576 4.82148 45.559C4.44322 45.2603 3.98532 45.111 3.44779 45.111C2.99984 45.111 2.60914 45.1907 2.27567 45.3499C1.9422 45.5042 1.60624 45.7406 1.26779 46.0592L0.573482 45.2902C1.01147 44.8771 1.47683 44.5785 1.96957 44.3943C2.46231 44.2052 2.96998 44.1106 3.49258 44.1106ZM3.5747 66.1106L4.61991 66.5511L1.88745 73.0538H7.37476V74.0542H0.558551V73.1433L3.5747 66.1106ZM6.04586 70.1347V76.5552H4.83641L4.82895 73.2927L5.00066 70.1347H6.04586ZM6.7551 88.2749L6.56846 89.2753H2.50711V92.5154C2.82067 92.3462 3.11681 92.2317 3.39553 92.172C3.67922 92.1073 3.97536 92.0749 4.28395 92.0749C4.84139 92.0749 5.33164 92.2018 5.7547 92.4557C6.17775 92.7045 6.50625 93.0704 6.74017 93.5531C6.9741 94.0359 7.09106 94.6183 7.09106 95.3001C7.09106 95.982 6.94672 96.5817 6.65805 97.0994C6.37435 97.617 5.97369 98.0176 5.45607 98.3013C4.93844 98.585 4.32376 98.7269 3.61203 98.7269C2.99487 98.7269 2.4424 98.6174 1.95464 98.3984C1.47186 98.1794 1.03138 97.8758 0.633208 97.4876L1.40964 96.741C1.7232 97.0595 2.05916 97.2984 2.41752 97.4577C2.78085 97.612 3.184 97.6892 3.62696 97.6892C4.30386 97.6892 4.83143 97.4851 5.2097 97.077C5.58796 96.6639 5.77709 96.0591 5.77709 95.2628C5.77709 94.7103 5.69497 94.2748 5.53072 93.9563C5.36648 93.6378 5.14251 93.4113 4.85881 93.2769C4.58009 93.1375 4.26902 93.0679 3.92559 93.0679C3.62199 93.0679 3.35322 93.0977 3.11929 93.1575C2.88537 93.2122 2.61909 93.2968 2.32046 93.4113H1.31259V88.2749H6.7551ZM4.49299 110.111C4.89116 110.111 5.25698 110.163 5.59045 110.267C5.92392 110.367 6.23499 110.514 6.52366 110.708L6.03093 111.559C5.797 111.415 5.54814 111.308 5.28435 111.238C5.02554 111.163 4.75429 111.126 4.47059 111.126C3.9231 111.126 3.45774 111.31 3.0745 111.678C2.69126 112.042 2.40258 112.557 2.20848 113.224C2.01437 113.886 1.9198 114.665 1.92478 115.561L1.93971 116.046C1.93971 117.31 2.10644 118.238 2.43991 118.831C2.77338 119.418 3.31838 119.712 4.07491 119.712C4.72691 119.712 5.21467 119.48 5.53819 119.017C5.86668 118.554 6.03093 117.925 6.03093 117.128C6.03093 116.566 5.95378 116.123 5.79949 115.8C5.65018 115.471 5.43865 115.237 5.1649 115.098C4.89116 114.958 4.57262 114.889 4.20929 114.889C3.67674 114.889 3.20639 115.048 2.79827 115.366C2.39014 115.685 2.05916 116.093 1.80533 116.591L1.77546 115.486C2.11391 114.909 2.49964 114.493 2.93265 114.239C3.36566 113.985 3.85591 113.858 4.4034 113.858C4.93595 113.858 5.42123 113.975 5.85922 114.209C6.2972 114.443 6.64809 114.802 6.91188 115.284C7.18065 115.762 7.31503 116.367 7.31503 117.099C7.31503 117.855 7.17069 118.505 6.88202 119.047C6.59335 119.585 6.20264 120 5.7099 120.294C5.21716 120.583 4.67465 120.727 4.08237 120.727C3.45525 120.727 2.92519 120.61 2.49217 120.376C2.05916 120.137 1.70827 119.799 1.43951 119.361C1.17074 118.918 0.974143 118.388 0.849714 117.77C0.730262 117.148 0.670537 116.456 0.670537 115.695C0.670537 114.56 0.819851 113.575 1.11848 112.739C1.42209 111.902 1.85759 111.255 2.42498 110.797C2.99735 110.34 3.68669 110.111 4.49299 110.111Z"
            fill="#808080"
          />
        </svg>
        <svg
          class="terminal__skeleton-lines"
          width="198"
          height="106"
          viewBox="0 0 198 106"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0.920898 2.53252C0.920898 1.15812 2.03507 0.0439453 3.40947 0.0439453H102.952C104.327 0.0439453 105.441 1.15812 105.441 2.53252V12.4868C105.441 13.8612 104.327 14.9754 102.952 14.9754H3.40948C2.03507 14.9754 0.920898 13.8612 0.920898 12.4868V2.53252Z"
          />
          <path
            d="M0.920898 24.9297C0.920898 23.5553 2.03507 22.4411 3.40947 22.4411H140.281C141.656 22.4411 142.77 23.5553 142.77 24.9297V34.884C142.77 36.2584 141.656 37.3726 140.281 37.3726H3.40948C2.03508 37.3726 0.920898 36.2584 0.920898 34.884V24.9297Z"
          />
          <path
            d="M0.920898 47.3268C0.920898 45.9524 2.03507 44.8383 3.40947 44.8383H32.0281C33.4025 44.8383 34.5167 45.9524 34.5167 47.3268V57.2811C34.5167 58.6555 33.4025 59.7697 32.0281 59.7697H3.40948C2.03507 59.7697 0.920898 58.6555 0.920898 57.2811V47.3268Z"
          />
          <path
            d="M0.920898 69.724C0.920898 68.3496 2.03507 67.2354 3.40947 67.2354H195.03C196.404 67.2354 197.518 68.3496 197.518 69.724V79.6783C197.518 81.0527 196.404 82.1669 195.03 82.1669H3.40948C2.03507 82.1669 0.920898 81.0527 0.920898 79.6783V69.724Z"
          />
          <path
            d="M0.920898 92.9102C0.920898 91.5358 2.03507 90.4217 3.40947 90.4217H89.2653C90.6397 90.4217 91.7539 91.5358 91.7539 92.9102V102.865C91.7539 104.239 90.6397 105.353 89.2653 105.353H3.40947C2.03507 105.353 0.920898 104.239 0.920898 102.865V92.9102Z"
          />
        </svg>
      </div>

      <!-- Browser (right-side) -->
      <svg
        class="browser"
        :class="{ active: browserActive }"
        width="350"
        height="223"
        viewBox="0 0 348 223"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g class="browser__background" filter="url(#shadow)">
          <rect
            x="17"
            y="-33"
            width="442"
            height="237"
            rx="18"
            fill="#242424"
            fill-opacity="1"
          />
        </g>
        <path
          d="M46.4409 148.062C46.4409 146.436 47.759 145.118 49.385 145.118H156.845C158.471 145.118 159.789 146.436 159.789 148.062V198.112C159.789 199.738 158.471 201.056 156.845 201.056H49.385C47.759 201.056 46.4409 199.738 46.4409 198.112V148.062Z"
          fill="url(#browser-bottom-left-square)"
        />
        <path
          d="M181.869 148.062C181.869 146.436 183.188 145.118 184.814 145.118H292.273C293.899 145.118 295.217 146.436 295.217 148.062V198.112C295.217 199.738 293.899 201.056 292.273 201.056H184.814C183.188 201.056 181.869 199.738 181.869 198.112V148.062Z"
          fill="url(#browser-bottom-middle-square)"
        />
        <path
          d="M317.298 148.062C317.298 146.436 318.616 145.118 320.242 145.118H427.702C429.328 145.118 430.646 146.436 430.646 148.062V198.112C430.646 199.738 429.328 201.056 427.702 201.056H320.242C318.616 201.056 317.298 199.738 317.298 198.112V148.062Z"
          fill="url(#browser-bottom-right-square)"
        />
        <path
          class="browser__major-edge"
          d="M46.4409 -7.97533C46.4409 -9.60131 47.759 -10.9194 49.385 -10.9194H427.702C429.328 -10.9194 430.646 -9.60132 430.646 -7.97533V74.4594C430.646 76.0854 429.328 77.4035 427.702 77.4035H49.385C47.759 77.4035 46.4409 76.0854 46.4409 74.4594V-7.97533Z"
          fill="#575757"
        />
        <path
          class="browser__heading-edge"
          d="M134.764 95.0681C134.764 93.4422 136.082 92.124 137.708 92.124H339.379C341.005 92.124 342.323 93.4422 342.323 95.0681V100.956C342.323 102.582 341.005 103.9 339.379 103.9H137.708C136.082 103.9 134.764 102.582 134.764 100.956V95.0681Z"
          fill="#575757"
        />
        <path
          class="browser__tagline-edge"
          d="M214.255 114.205C214.255 112.579 215.573 111.261 217.199 111.261H256.944C258.57 111.261 259.888 112.579 259.888 114.205V120.093C259.888 121.719 258.57 123.037 256.944 123.037H217.199C215.573 123.037 214.255 121.719 214.255 120.093V114.205Z"
          fill="#575757"
        />
        <g filter="url(#browser-glow-filter)">
          <path
            class="browser__major-glow"
            d="M46.4409 -7.97533C46.4409 -9.60131 47.759 -10.9194 49.385 -10.9194H427.702C429.328 -10.9194 430.646 -9.60132 430.646 -7.97533V74.4594C430.646 76.0854 429.328 77.4035 427.702 77.4035H49.385C47.759 77.4035 46.4409 76.0854 46.4409 74.4594V-7.97533Z"
            fill="#575757"
          />
          <path
            class="browser__heading-glow"
            d="M134.764 95.0681C134.764 93.4422 136.082 92.124 137.708 92.124H339.379C341.005 92.124 342.323 93.4422 342.323 95.0681V100.956C342.323 102.582 341.005 103.9 339.379 103.9H137.708C136.082 103.9 134.764 102.582 134.764 100.956V95.0681Z"
            fill="#575757"
          />
          <path
            class="browser__tagline-glow"
            d="M214.255 114.205C214.255 112.579 215.573 111.261 217.199 111.261H256.944C258.57 111.261 259.888 112.579 259.888 114.205V120.093C259.888 121.719 258.57 123.037 256.944 123.037H217.199C215.573 123.037 214.255 121.719 214.255 120.093V114.205Z"
            fill="#575757"
          />
        </g>
        <defs>
          <filter id="shadow" x="-20%" y="0" width="140%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="10" result="blur" />
            <feOffset in="blur" dx="5" dy="5" result="offsetBlur" />
            <feComponentTransfer result="shadowOpacity">
              <feFuncA type="linear" slope="0.6" />
              <!-- Adjust the slope value to control opacity -->
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="shadowOpacity" />
              <!-- Use the result of feComponentTransfer -->
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id="browser-glow-filter"
            x="24"
            y="-33"
            width="428"
            height="178"
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
            <feGaussianBlur stdDeviation="8" result="glow-effect" />
          </filter>
          <linearGradient
            id="browser-bottom-left-square"
            x1="238.543"
            y1="145.118"
            x2="238.543"
            y2="201.056"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stop-color="#404040" />
            <stop offset="1" stop-color="#404040" stop-opacity="0" />
          </linearGradient>
          <linearGradient
            id="browser-bottom-middle-square"
            x1="238.543"
            y1="145.118"
            x2="238.543"
            y2="201.056"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stop-color="#404040" />
            <stop offset="1" stop-color="#404040" stop-opacity="0" />
          </linearGradient>
          <linearGradient
            id="browser-bottom-right-square"
            x1="238.543"
            y1="145.118"
            x2="238.543"
            y2="201.056"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stop-color="#404040" />
            <stop offset="1" stop-color="#404040" stop-opacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <!-- Blue glow effect -->
      <div class="corner-glow" />

      <!-- Lines connecting the two sides  -->
      <div class="connecting-lines" :class="{ active: connectionsActive }">
        <div class="connecting-lines__line" />
        <div class="connecting-lines__line" />
        <div class="connecting-lines__line" />
      </div>
    </div>
    <div class="feature__meta meta--center">
      <div class="meta__title">Lightning fast HMR</div>
      <div class="meta__description">
        Hot Module Replacement (HMR) that stays fast regardless of app size.
      </div>
    </div>
  </div>
</template>

<style scoped>
.feature-card {
  @media (min-width: 768px) {
    transform: translate3d(60px, 0, 0);
  }

  &:hover {
    .corner-glow {
      opacity: 1;
    }
  }

  /* Extend height on smaller devices, to make room for text */
  @media (max-width: 400px) {
    height: 380px;
  }
}

.feature__visualization {
  --left-offset: calc(100% / 2);

  @media (min-width: 480px) {
    --left-offset: 140px;
  }

  @media (min-width: 900px) {
    --left-offset: 100px;
  }

  @media (min-width: 1100px) {
    --left-offset: 0px;
  }

  .terminal {
    position: absolute;
    top: 33px;
    left: calc(32px - var(--left-offset));
    width: 280px;
    height: 160px;
    border-radius: 12px;
    background: #1e1e1e;
    overflow: hidden;
    border: 1px solid transparent;

    .terminal__line-numbers {
      position: absolute;
      top: 16px;
      left: 22px;
    }

    .terminal__skeleton-lines {
      position: absolute;
      top: 14px;
      left: 45px;

      path {
        transition: all 0.3s ease;
        fill: #525252;
        opacity: 0.2;
      }
    }

    &.active {
      .terminal__skeleton-lines {
        path {
          opacity: 1;
          fill: #41d1ff;

          &:nth-child(2) {
            transition-delay: 0.1s;
            fill: #41d1ff;
          }

          &:nth-child(3) {
            transition-delay: 0.2s;
          }

          &:nth-child(4) {
            transition-delay: 0.3s;
          }

          &:nth-child(5) {
            transition-delay: 0.4s;
            fill: #c063ed;
          }
        }
      }
    }
  }

  .browser {
    position: absolute;
    top: 0;
    left: calc(360px - var(--left-offset));
    z-index: 2;

    @media (min-width: 640px) and (max-width: 768px) {
      left: unset;
      right: 0;
    }

    @media (min-width: 1200px) {
      left: unset;
      right: 0;
    }

    * {
      transition: all 0.5s ease;
    }

    /* Background */

    .browser__background {
      stroke: #2b2b2b;
      stroke-width: 3px;
    }

    /* Major "Screen" of Browser */

    .browser__major-glow,
    .browser__major-edge {
      fill: #41d1ff;
      filter: grayscale(1) brightness(40%);
    }

    .browser__major-glow {
      opacity: 0;
    }

    /* Heading */

    .browser__heading-glow,
    .browser__heading-edge {
      fill: #41d1ff;
      filter: grayscale(1) brightness(40%);
    }

    .browser__heading-glow {
      opacity: 0;
    }

    /* Tagline */

    .browser__tagline-glow,
    .browser__tagline-edge {
      fill: #c063ed;
      filter: grayscale(1) brightness(60%);
    }

    .browser__tagline-glow {
      opacity: 0;
    }

    &.active {
      /* Major "Screen" of Browser */

      .browser__major-glow,
      .browser__major-edge {
        filter: grayscale(0) brightness(100%);
      }

      .browser__major-glow {
        opacity: 1;
      }

      /* Heading */

      .browser__heading-glow,
      .browser__heading-edge {
        filter: grayscale(0) brightness(100%);
        transition-delay: 0.2s;
      }

      .browser__heading-glow {
        opacity: 1;
      }

      /* Tagline */

      .browser__tagline-glow,
      .browser__tagline-edge {
        filter: grayscale(0) brightness(100%);
        transition-delay: 0.3s;
      }

      .browser__tagline-glow {
        opacity: 1;
      }
    }
  }

  .corner-glow {
    position: absolute;
    top: 0;
    right: 0;
    width: 300px;
    height: 140px;
    background: #41d1ff;
    filter: blur(140px);
    z-index: -1;
    transform: translate3d(20px, 0, 0);
    opacity: 0.5;
    transition: opacity 1s ease-out;
    will-change: opacity;
  }

  .connecting-lines {
    &.active {
      .connecting-lines__line {
        transform: translate3d(0, 0, 0) scaleX(1);
      }
    }
  }

  .connecting-lines__line {
    height: 2px;
    border-radius: 1px;
    background: linear-gradient(to left, #41d1ff, #41d1ff00);
    position: absolute;
    width: calc(var(--base-width) - 35px);
    transform-origin: left center;
    transition: all 0.6s ease;
    transform: translate3d(0, 0, 0) scaleX(0);

    @media (min-width: 640px) and (max-width: 768px) {
      width: calc(
        (var(--base-width) - var(--left-offset)) + (100% - 350px) - 115px
      );
    }

    @media (min-width: 1200px) {
      width: var(--base-width);
    }

    &:nth-child(1) {
      --base-width: 225px;
      top: 54px;
      left: calc(185px - var(--left-offset));
    }

    &:nth-child(2) {
      --base-width: 190px;
      background: linear-gradient(to right, transparent, #7e5dee);
      top: 76px;
      left: calc(220px - var(--left-offset));
      transition-delay: 0.3s;
    }

    &:nth-child(3) {
      --base-width: 240px;
      background: linear-gradient(to right, #bd34fe00, #c063ed);
      top: 145px;
      left: calc(170px - var(--left-offset));
      transition-delay: 0.4s;
    }
  }
}
</style>
