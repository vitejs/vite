<script setup lang="ts">
/**
 * Adding a new banner:
 * 1. uncomment the banner slot in ../index.ts
 * 2. uncomment and update BANNER_ID in ../../inlined-scripts/restorePreferences.ts
 * 3. update --vp-layout-top-height if necessary
 */
import { ref } from 'vue'

const open = ref(true)

/**
 * Call this if the banner is dismissible
 */
function dismiss() {
  open.value = false
  document.documentElement.classList.add('banner-dismissed')
  localStorage.setItem(`vite-docs-banner-${window.__VITE_BANNER_ID__}`, 'true')
}
</script>

<template>
  <div class="banner" v-if="open">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="12"
      fill="none"
      viewBox="0 0 103 15"
    >
      <path
        d="M9.137 10.691 12.907.249h5.16l-5.72 14.503h-6.63L0 .249h5.304zm15.622 4.06h-4.973V.25h4.973zM42.817 3.813h-5.573v10.94h-4.971V3.812h-5.574V.25h16.118zm16.257-.04h-9.343v1.946h9.199v3.418h-9.2v2.093h9.614v3.523H44.759V.249h14.315zm10.934 1.946h5.573v3.418h-5.573v5.616h-3.564V9.136h-5.573V5.718h5.573V.248h3.564z"
        fill="#ffffff"
      />
      <path
        d="M91.184 14.654a.363.363 0 0 1-.648-.224v-3.303c0-.4-.324-.725-.725-.725h-3.647c-.295 0-.467-.334-.295-.573l2.398-3.357a.725.725 0 0 0-.59-1.147h-4.414c-.295 0-.467-.334-.295-.574L86.076.4a.36.36 0 0 1 .295-.152h9.263c.295 0 .467.334.295.573l-2.398 3.358a.725.725 0 0 0 .59 1.147h3.648c.302 0 .472.348.285.587z"
        fill="#6254fe"
      />
      <mask
        id="a"
        width="17"
        height="15"
        x="82"
        y="0"
        maskUnits="userSpaceOnUse"
        style="mask-type: alpha"
      >
        <path
          fill="#833bff"
          d="M91.184 14.654a.363.363 0 0 1-.648-.224v-3.303c0-.4-.324-.725-.725-.725h-3.647c-.295 0-.467-.334-.295-.573l2.398-3.357a.725.725 0 0 0-.59-1.147h-4.414c-.295 0-.467-.334-.295-.574L86.076.4a.36.36 0 0 1 .295-.152h9.263c.295 0 .467.334.295.573l-2.398 3.358a.725.725 0 0 0 .59 1.147h3.648c.302 0 .472.348.285.587z"
        />
      </mask>
      <g mask="url(#a)">
        <g filter="url(#b)">
          <ellipse
            cx="1.766"
            cy="4.714"
            fill="#ede6ff"
            rx="1.766"
            ry="4.714"
            transform="rotate(89.814 35.524 46.024)scale(1 -1)"
          />
        </g>
        <g filter="url(#c)">
          <ellipse
            cx="3.334"
            cy="9.57"
            fill="#ede6ff"
            rx="3.334"
            ry="9.57"
            transform="rotate(89.814 33.737 36.63)scale(1 -1)"
          />
        </g>
        <g filter="url(#d)">
          <ellipse
            cx="1.766"
            cy="9.774"
            fill="#4e14ff"
            rx="1.766"
            ry="9.774"
            transform="rotate(89.814 33.002 36.998)scale(1 -1)"
          />
        </g>
        <g filter="url(#e)">
          <ellipse
            cx="1.766"
            cy="9.81"
            fill="#4e14ff"
            rx="1.766"
            ry="9.81"
            transform="rotate(89.814 30.844 40.622)scale(1 -1)"
          />
        </g>
        <g filter="url(#f)">
          <ellipse
            cx="1.766"
            cy="9.81"
            fill="#4e14ff"
            rx="1.766"
            ry="9.81"
            transform="rotate(89.814 30.904 41.053)scale(1 -1)"
          />
        </g>
        <g filter="url(#g)">
          <ellipse
            cx="4.511"
            cy="7.078"
            fill="#ede6ff"
            rx="4.511"
            ry="7.078"
            transform="rotate(93.35 49.173 54.748)scale(-1 1)"
          />
        </g>
        <g filter="url(#h)">
          <ellipse
            cx="1.113"
            cy="6.893"
            fill="#4e14ff"
            rx="1.113"
            ry="6.893"
            transform="rotate(89.009 50.51 57.537)scale(-1 1)"
          />
        </g>
        <g filter="url(#i)">
          <ellipse
            cx="1.113"
            cy="6.893"
            fill="#4e14ff"
            rx="1.113"
            ry="6.893"
            transform="rotate(89.009 50.51 57.537)scale(-1 1)"
          />
        </g>
        <g filter="url(#j)">
          <ellipse
            cx="82.99"
            cy="3.123"
            fill="#4e14ff"
            rx="1.413"
            ry="9.332"
            transform="rotate(39.51 82.99 3.123)"
          />
        </g>
        <g filter="url(#k)">
          <ellipse
            cx="98.102"
            cy="-1.706"
            fill="#4e14ff"
            rx="1.413"
            ry="9.332"
            transform="rotate(37.892 98.102 -1.706)"
          />
        </g>
        <g filter="url(#l)">
          <ellipse
            cx="95.97"
            cy="3.395"
            fill="#2bfdd2"
            rx="2.655"
            ry="4.005"
            transform="rotate(37.892 95.97 3.395)"
          />
        </g>
        <g filter="url(#m)">
          <ellipse
            cx="82.264"
            cy="12.536"
            fill="#4e14ff"
            rx="1.413"
            ry="9.332"
            transform="rotate(37.892 82.264 12.536)"
          />
        </g>
        <g filter="url(#n)">
          <ellipse
            cx="82.264"
            cy="12.536"
            fill="#4e14ff"
            rx="1.413"
            ry="9.332"
            transform="rotate(37.892 82.264 12.536)"
          />
        </g>
        <g filter="url(#o)">
          <ellipse
            cx="94.226"
            cy="9.781"
            fill="#4e14ff"
            rx="1.501"
            ry="9.332"
            transform="rotate(37.892 94.226 9.78)"
          />
        </g>
        <g filter="url(#p)">
          <ellipse
            cx="95.66"
            cy="10.827"
            fill="#2bfdd2"
            rx="2.578"
            ry="6.754"
            transform="rotate(37.892 95.66 10.827)"
          />
        </g>
      </g>
      <path
        d="M80.53 0c-2.949 4.221-2.966 10.764 0 15h1.993c-2.966-4.236-2.949-10.779 0-15zM100.543 0H98.55c2.949 4.221 2.966 10.764 0 15h1.993c2.965-4.236 2.948-10.779 0-15"
        fill="#ffffff"
      />
      <defs>
        <filter
          id="b"
          width="19.25"
          height="13.354"
          x="76.528"
          y="5.425"
          color-interpolation-filters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_318_41192"
            stdDeviation="2.455"
          />
        </filter>
        <filter
          id="c"
          width="28.962"
          height="16.49"
          x="65.358"
          y="-2.168"
          color-interpolation-filters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_318_41192"
            stdDeviation="2.455"
          />
        </filter>
        <filter
          id="d"
          width="25.441"
          height="9.425"
          x="66.952"
          y=".898"
          color-interpolation-filters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_318_41192"
            stdDeviation="1.473"
          />
        </filter>
        <filter
          id="e"
          width="25.513"
          height="9.425"
          x="68.425"
          y="6.668"
          color-interpolation-filters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_318_41192"
            stdDeviation="1.473"
          />
        </filter>
        <filter
          id="f"
          width="25.513"
          height="9.425"
          x="68.916"
          y="7.037"
          color-interpolation-filters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_318_41192"
            stdDeviation="1.473"
          />
        </filter>
        <filter
          id="g"
          width="23.964"
          height="18.867"
          x="87.917"
          y="-5.492"
          color-interpolation-filters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_318_41192"
            stdDeviation="2.455"
          />
        </filter>
        <filter
          id="h"
          width="19.677"
          height="8.131"
          x="90.415"
          y=".979"
          color-interpolation-filters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_318_41192"
            stdDeviation="1.473"
          />
        </filter>
        <filter
          id="i"
          width="19.677"
          height="8.131"
          x="90.415"
          y=".979"
          color-interpolation-filters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_318_41192"
            stdDeviation="1.473"
          />
        </filter>
        <filter
          id="j"
          width="17.968"
          height="20.405"
          x="74.006"
          y="-7.079"
          color-interpolation-filters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_318_41192"
            stdDeviation="1.473"
          />
        </filter>
        <filter
          id="k"
          width="17.573"
          height="20.725"
          x="89.315"
          y="-12.068"
          color-interpolation-filters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_318_41192"
            stdDeviation="1.473"
          />
        </filter>
        <filter
          id="l"
          width="12.356"
          height="13.008"
          x="89.792"
          y="-3.109"
          color-interpolation-filters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_318_41192"
            stdDeviation="1.473"
          />
        </filter>
        <filter
          id="m"
          width="17.573"
          height="20.725"
          x="73.477"
          y="2.174"
          color-interpolation-filters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_318_41192"
            stdDeviation="1.473"
          />
        </filter>
        <filter
          id="n"
          width="17.573"
          height="20.725"
          x="73.477"
          y="2.174"
          color-interpolation-filters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_318_41192"
            stdDeviation="1.473"
          />
        </filter>
        <filter
          id="o"
          width="17.601"
          height="20.738"
          x="85.425"
          y="-.588"
          color-interpolation-filters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_318_41192"
            stdDeviation="1.473"
          />
        </filter>
        <filter
          id="p"
          width="15.135"
          height="17.016"
          x="88.092"
          y="2.319"
          color-interpolation-filters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur
            result="effect1_foregroundBlur_318_41192"
            stdDeviation="1.473"
          />
        </filter>
      </defs>
    </svg>
    <div class="vt-banner-text">
      <p style="display: inline-block">The Unified Toolchain for the Web</p>
      <a
        target="_blank"
        class="vt-primary-action"
        href="https://voidzero.dev/posts/announcing-vite-plus?utm_source=vite&utm_content=top_banner"
      >
        Learn more
      </a>
    </div>
    <button aria-label="close" @click="dismiss">
      <svg
        class="close"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
      >
        <path
          d="M18.9,10.9h-6v-6c0-0.6-0.4-1-1-1s-1,0.4-1,1v6h-6c-0.6,0-1,0.4-1,1s0.4,1,1,1h6v6c0,0.6,0.4,1,1,1s1-0.4,1-1v-6h6c0.6,0,1-0.4,1-1S19.5,10.9,18.9,10.9z"
        />
      </svg>
    </button>
    <div class="glow glow--purple"></div>
    <div class="glow glow--blue"></div>
  </div>
</template>

<style>
html:not(.banner-dismissed) {
  --vp-layout-top-height: 30px;
}
</style>

<style scoped>
.banner {
  position: fixed;
  z-index: 10;
  box-sizing: border-box;
  top: 0;
  left: 0;
  right: 0;
  height: var(--vp-layout-top-height);
  line-height: var(--vp-layout-top-height);
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
  background: #262626;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.glow.glow--purple {
  position: absolute;
  bottom: -15%;
  left: -75%;
  width: 80%;
  aspect-ratio: 1.5;
  pointer-events: none;
  border-radius: 100%;
  background: linear-gradient(270deg, #7a23a1, #715ebde6 60% 80%, #bd34fe00);
  filter: blur(15vw);
  transform: none;
  opacity: 0.6;
}

.glow.glow--blue {
  position: absolute;
  bottom: -15%;
  right: -40%;
  width: 80%;
  aspect-ratio: 1.5;
  pointer-events: none;
  border-radius: 100%;
  background: linear-gradient(180deg, #61d9ff, #0000);
  filter: blur(15vw);
  transform: none;
  opacity: 0.3;
}

@media (min-width: 768px) {
  .glow.glow--blue {
    top: -15%;
    right: -40%;
    width: 80%;
  }

  .glow.glow--purple {
    bottom: -15%;
    left: -40%;
    width: 80%;
  }
}

@media (min-width: 1025px) {
  .glow.glow--blue {
    top: -15%;
    right: -40%;
    width: 80%;
  }

  .glow.glow--purple {
    bottom: -15%;
    left: -40%;
    width: 80%;
  }
}

.banner-dismissed .banner {
  display: none;
}

button {
  position: absolute;
  right: 0;
  top: 0;
  padding: 5px 5px;
}

.close {
  width: 20px;
  height: 20px;
  fill: #fff;
  transform: rotate(45deg);
}

.vt-banner-text {
  color: #fff;
  font-size: 14px;
  margin-left: 0.75rem;
}

.vt-main {
  color: transparent;
  background-image: linear-gradient(120deg, #858487 16%, #9499ff, #9499ff);
  background-clip: text;
}

.vt-primary-action {
  background:
    radial-gradient(140.35% 140.35% at 175% 94.74%, #2bfdd2, #bd34fe00),
    radial-gradient(89.94% 89.94% at 18.42% 15.79%, #603cff, #41d1ff00);
  color: #fff;
  padding: 4px 8px;
  border-radius: 5px;
  font-size: 12px;
  text-decoration: none;
  margin: 0 0.75rem;
  transition: all 0.2s ease-in-out;
}

@media (max-width: 1280px) {
  .banner .vt-banner-text,
  .banner .vt-primary-action {
    font-size: 10px;
  }

  .vt-tagline {
    display: none;
  }
}

@media (max-width: 780px) {
  .vt-tagline {
    display: none;
  }

  .vt-coupon {
    display: none;
  }

  .vt-primary-action {
    margin: 0 10px;
    padding: 4px 8px;
  }

  .vt-time-now {
    display: none;
  }
}

@media (max-width: 560px) {
  .vt-place {
    display: none;
  }
}
</style>
