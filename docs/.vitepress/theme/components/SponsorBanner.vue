<script setup>
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
  localStorage.setItem(`vite-docs-banner-${__VITE_BANNER_ID__}`, 'true')
}
</script>

<template>
  <div class="banner" v-if="open">
    <svg
      style="margin-right: 0.5rem"
      width="20"
      height="20"
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        <path
          d="M20.3653 1.01733L11.1779 2.87249C11.0895 2.87249 11.0012 2.96082 11.0012 2.96082C10.9128 3.04916 10.9128 3.13751 10.9128 3.13751L10.3828 13.2083C10.3828 13.2967 10.3828 13.2967 10.3828 13.3851C10.3828 13.4734 10.4711 13.4734 10.4711 13.4734C10.4711 13.4734 10.5595 13.5618 10.6478 13.5618C10.7361 13.5618 10.7361 13.5618 10.8245 13.5618L13.3864 12.9433C13.6514 12.855 13.8281 13.12 13.8281 13.3851L13.033 17.3603C12.9447 17.6254 13.2097 17.8905 13.4748 17.8021L15.0648 17.272C15.3299 17.1837 15.5066 17.4487 15.5066 17.7137L14.2697 23.8976C14.1815 24.251 14.7115 24.5159 14.8882 24.1626L15.0648 23.8976L22.5738 8.08458C22.5738 7.90789 22.3088 7.55453 22.0438 7.64287L19.3935 8.17292C19.1286 8.26125 18.9519 7.99624 19.0402 7.73122L20.7187 1.45903C20.807 1.19401 20.6304 0.928988 20.3653 1.01733Z"
          fill="url(#paint0_linear_648_13)"
        />
        <path
          d="M29.6424 3.75619C29.2891 3.22614 28.5824 2.96112 27.964 3.04945L20.985 4.37457L20.72 5.43465L28.2289 4.10955C28.494 4.02121 28.7591 4.19788 28.9357 4.37457C29.1124 4.63959 29.1124 4.90462 28.9357 5.16964L15.773 28.5799C15.6846 28.845 15.4196 28.9332 15.1545 28.9332C14.8896 28.9332 14.6245 28.7566 14.5361 28.5799L1.10836 5.08129C0.931674 4.90462 0.931674 4.55125 1.10836 4.37457C1.28504 4.19788 1.46172 4.10955 1.72674 4.10955C1.72674 4.10955 1.81508 4.10955 1.90342 4.10955L9.85411 5.523L9.94246 4.55125L1.99176 3.04945C1.28504 2.96112 0.666654 3.22614 0.313291 3.75619C-0.0400717 4.28623 -0.128412 4.99295 0.22495 5.61134L13.6528 29.1099C13.9178 29.64 14.5361 29.9933 15.1545 29.9933C15.773 29.9933 16.303 29.64 16.6563 29.1099L29.8191 5.61134C30.0842 4.99295 30.0842 4.28623 29.6424 3.75619Z"
          fill="url(#paint1_linear_648_13)"
        />
      </g>
      <defs>
        <linearGradient
          id="paint0_linear_648_13"
          x1="10.5947"
          y1="3.97762"
          x2="20.9471"
          y2="17.0584"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#B047FF" />
          <stop offset="0.75" stop-color="#FFD0D0" />
          <stop offset="0.9167" stop-color="#FFF3E6" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_648_13"
          x1="8.078"
          y1="1.32911"
          x2="23.118"
          y2="18.0977"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#57CCFF" />
          <stop offset="1" stop-color="#AF48FF" />
        </linearGradient>
      </defs>
    </svg>
    <p class="vt-banner-text">
      <span class="vt-main">ViteConf 2025</span>
      <span class="vt-tagline">
        · First time <span style="font-weight: 900">in-person</span></span
      >
      <span class="vt-place"> · Amsterdam</span>
      <span class="vt-date"> · Oct 09-10</span>
      <a
        target="_blank"
        class="vt-primary-action"
        href="https://viteconf.amsterdam/?utm_source=vite&utm_content=top_banner"
      >
        Register
      </a>
    </p>
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
  font-size: 12px;
}

.vt-main {
  color: transparent;
  background-image: linear-gradient(120deg, #b047ff 16%, #9499ff, #9499ff);
  background-clip: text;
}

.vt-primary-action {
  background:
    radial-gradient(141.42% 141.42% at 100% 0%, #ffffff80, #fff0),
    radial-gradient(140.35% 140.35% at 100% 94.74%, #bd34fe, #bd34fe00),
    radial-gradient(89.94% 89.94% at 18.42% 15.79%, #41d1ff, #41d1ff00);
  color: #fff;
  padding: 4px 8px;
  border-radius: 5px;
  font-size: 10px;
  text-decoration: none;
  margin: 0 10px;
  transition: all 0.2s ease-in-out;

  &:hover {
    box-shadow: 0 1px #fffc inset;
  }
}

@media (max-width: 1280px) {
  .banner .vt-banner-text {
    font-size: 14px;
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
