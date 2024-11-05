<script setup>
import logoJSON from './images/json.svg'
import logoCSS from './images/css3.svg'
import logoJS from './images/js.svg'
import logoTS from './images/ts.svg'
import logoWA from './images/wa.svg'
import logoPostCSS from './images/postcss.svg'
import { useSlideIn } from '../../../composables/useSlideIn'
import { useCardAnimation } from '../../../composables/useCardAnimation'

/**
 * Slide the card in when the page loads
 */
useSlideIn('#rich-features-card')

/**
 * Start the animation when the card is hovered
 */
const { isCardActive, startAnimation } = useCardAnimation(
  '#rich-features-card',
  null,
  {
    once: true,
  },
)
</script>

<template>
  <div
    class="feature-card"
    id="rich-features-card"
    :class="{ active: isCardActive }"
    @mouseover.stop.prevent="startAnimation"
  >
    <div class="feature__visualization">
      <div class="card-container">
        <svg
          class="background-cards"
          width="658"
          height="275"
          viewBox="0 0 658 275"
          d
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M105.376 201.33C105.376 193.847 111.442 187.781 118.925 187.781H176.507C183.99 187.781 190.056 193.847 190.056 201.33V258.912C190.056 266.395 183.99 272.461 176.507 272.461H118.925C111.442 272.461 105.376 266.395 105.376 258.912V201.33Z"
            class="background-card"
          />
          <path
            d="M525.389 96.3271C525.389 88.8443 531.455 82.7783 538.937 82.7783H596.518C604 82.7783 610.066 88.8443 610.066 96.3271V153.909C610.066 161.392 604 167.458 596.518 167.458H538.937C531.455 167.458 525.389 161.392 525.389 153.909V96.3271Z"
            class="background-card"
          />
          <path
            d="M210.38 -10.3692C210.38 -17.852 216.446 -23.9179 223.929 -23.9179H281.512C288.994 -23.9179 295.06 -17.852 295.06 -10.3692V47.2129C295.06 54.6957 288.994 60.7617 281.512 60.7617H223.929C216.446 60.7617 210.38 54.6957 210.38 47.2129V-10.3692Z"
            class="background-card"
          />
          <path
            d="M525.389 201.33C525.389 193.847 531.455 187.781 538.937 187.781H596.518C604 187.781 610.066 193.847 610.066 201.33V258.912C610.066 266.395 604 272.461 596.518 272.461H538.937C531.455 272.461 525.389 266.395 525.389 258.912V201.33Z"
            class="background-card"
          />
          <path
            d="M630.389 201.33C630.389 193.847 636.455 187.781 643.938 187.781H701.52C709.003 187.781 715.069 193.847 715.069 201.33V258.912C715.069 266.395 709.003 272.461 701.52 272.461H643.938C636.455 272.461 630.389 266.395 630.389 258.912V201.33Z"
            class="background-card"
          />
          <path
            d="M0.373901 201.33C0.373901 193.847 6.4399 187.781 13.9227 187.781H71.5045C78.9873 187.781 85.0531 193.847 85.0531 201.33V258.912C85.0531 266.395 78.9873 272.461 71.5045 272.461H13.9227C6.4399 272.461 0.373901 266.395 0.373901 258.912V201.33Z"
            class="background-card"
          />
          <path
            d="M630.389 96.3271C630.389 88.8443 636.455 82.7783 643.938 82.7783H701.52C709.003 82.7783 715.069 88.8443 715.069 96.3271V153.909C715.069 161.392 709.003 167.458 701.52 167.458H643.938C636.455 167.458 630.389 161.392 630.389 153.909V96.3271Z"
            class="background-card"
          />
          <path
            d="M0.373901 96.3271C0.373901 88.8443 6.4399 82.7783 13.9227 82.7783H71.5045C78.9873 82.7783 85.0531 88.8443 85.0531 96.327V153.909C85.0531 161.392 78.9873 167.458 71.5045 167.458H13.9227C6.4399 167.458 0.373901 161.392 0.373901 153.909V96.3271Z"
            class="background-card"
          />
          <path
            d="M630.389 -10.3692C630.389 -17.852 636.455 -23.918 643.938 -23.918H701.52C709.003 -23.918 715.069 -17.852 715.069 -10.3692V47.2129C715.069 54.6957 709.003 60.7616 701.52 60.7616H643.938C636.455 60.7616 630.389 54.6957 630.389 47.2129V-10.3692Z"
            class="background-card"
          />
          <path
            d="M0.373901 -10.3692C0.373901 -17.852 6.4399 -23.9179 13.9227 -23.9179H71.5045C78.9873 -23.9179 85.0531 -17.852 85.0531 -10.3692V47.2129C85.0531 54.6957 78.9873 60.7617 71.5045 60.7617H13.9227C6.4399 60.7617 0.373901 54.6957 0.373901 47.2129V-10.3692Z"
            class="background-card"
          />
          <path
            d="M525.389 -10.3692C525.389 -17.8519 531.455 -23.9179 538.937 -23.9179H596.518C604 -23.9179 610.066 -17.8519 610.066 -10.3692V47.213C610.066 54.6957 604 60.7617 596.518 60.7617H538.937C531.455 60.7617 525.389 54.6957 525.389 47.213V-10.3692Z"
            class="background-card"
          />
          <path
            d="M420.386 -10.3692C420.386 -17.852 426.452 -23.9179 433.935 -23.9179H491.517C499 -23.9179 505.066 -17.852 505.066 -10.3692V47.2129C505.066 54.6957 499 60.7617 491.517 60.7617H433.935C426.452 60.7617 420.386 54.6957 420.386 47.2129V-10.3692Z"
            class="background-card"
          />
          <path
            d="M315.383 -10.3692C315.383 -17.852 321.449 -23.9179 328.932 -23.9179H386.514C393.997 -23.9179 400.063 -17.852 400.063 -10.3692V47.2129C400.063 54.6957 393.997 60.7617 386.514 60.7617H328.932C321.449 60.7617 315.383 54.6957 315.383 47.2129V-10.3692Z"
            class="background-card"
          />
          <path
            d="M210.38 203.023C210.38 195.541 216.446 189.475 223.929 189.475H281.512C288.994 189.475 295.06 195.541 295.06 203.023V260.605C295.06 268.088 288.994 274.154 281.512 274.154H223.929C216.446 274.154 210.38 268.088 210.38 260.605V203.023Z"
            class="background-card"
          />
          <path
            d="M315.383 203.023C315.383 195.541 321.449 189.475 328.932 189.475H386.514C393.997 189.475 400.063 195.541 400.063 203.023V260.605C400.063 268.088 393.997 274.154 386.514 274.154H328.932C321.449 274.154 315.383 268.088 315.383 260.605V203.023Z"
            class="background-card"
          />
        </svg>
        <div class="card card--json">
          <img :src="logoJSON" alt="JSON" />
        </div>
        <div class="card card--css">
          <img :src="logoCSS" alt="CSS3" />
        </div>
        <div class="card card--js">
          <img :src="logoJS" alt="Javascript" />
        </div>
        <div class="card card--ts">
          <img :src="logoTS" alt="Typescript" />
        </div>
        <div class="card card--wa">
          <img :src="logoWA" alt="WebAssembly" />
        </div>
        <div class="card card--postcss">
          <img :src="logoPostCSS" alt="PostCSS" />
        </div>
      </div>
      <!-- Center glow effect -->
      <div class="center-glow" />
    </div>
    <div class="feature__meta meta--center">
      <div class="meta__title">Rich features</div>
      <div class="meta__description">
        Out-of-the-box support for TypeScript, JSX, CSS and more.
      </div>
    </div>
  </div>
</template>

<style scoped>
@property --opacity {
  syntax: '<number>';
  initial-value: 1;
  inherits: false;
}

.feature-card {
  @media (min-width: 768px) {
    transform: translate3d(-60px, 0, 0);
  }

  &.active {
    .feature__visualization {
      .card {
        &:after {
          border-color: rgba(60, 60, 60, 0.8);
          --opacity: 0.8;
          box-shadow: var(--card-color) 0 10px 20px -10px;
        }
      }

      .center-glow {
        opacity: 1;
      }
    }
  }
}

.feature__visualization {
  display: flex;
  justify-content: center;
  align-content: flex-start;

  .card-container {
    flex-shrink: 0;
    mask-image: radial-gradient(
      ellipse 50% 45% at center 25%,
      rgba(0, 0, 0, 1) 50%,
      rgba(0, 0, 0, 0.7) 80%,
      rgba(0, 0, 0, 0) 100%
    );
    position: relative;
    background: #141414;

    .background-card {
      fill: #181818;
    }
  }

  .center-glow {
    position: absolute;
    top: 0;
    left: 50%;
    width: 300px;
    height: 140px;
    background: #ffffff;
    filter: blur(80px);
    z-index: 5;
    transform: translate3d(-50%, 0, 0);
    opacity: 0.5;
    transition: opacity 0.3s ease;
    will-change: opacity;
    mix-blend-mode: overlay;
  }

  .card {
    position: absolute;
    z-index: 1;
    display: flex;
    background: var(--card-color);
    width: 85px;
    aspect-ratio: 1;
    border-radius: 10px;
    align-items: center;
    justify-content: center;
    transform: translate3d(0, 0, 0);
    transition: all 0.3s ease;
    will-change: box-shadow;
    --card-color: #181818;

    * {
      position: relative;
      z-index: 2;
    }

    &:after {
      border: 1px solid rgba(60, 60, 60, 0.5);
      content: '';
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      bottom: -1px;
      border-radius: 10px;
      --opacity: 0.99;
      background: linear-gradient(
        to bottom,
        #181818 30%,
        rgba(24 24 24 / var(--opacity)) 100%
      );
      will-change: background;
      box-shadow: var(--card-color) 0 5px 10px -30px;
      transition:
        --opacity 0.8s ease,
        box-shadow 0.5s ease;
      z-index: 1;
    }

    &.card--json {
      top: -23px;
      left: 105px;
    }

    &.card--css {
      top: 83px;
      left: 105px;
      --card-color: #2a53dd;
    }

    &.card--js {
      top: 83px;
      left: 210px;
      --card-color: #f7e425;
    }

    &.card--ts {
      top: 83px;
      left: 315px;
      --card-color: #3d95d2;
    }

    &.card--wa {
      top: 83px;
      left: 420px;
      --card-color: #7259f0;
    }

    &.card--postcss {
      top: 189px;
      left: 420px;
    }
  }
}
</style>
