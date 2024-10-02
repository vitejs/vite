<script setup lang="ts">
import { useSlideIn } from '../../../composables/useSlideIn'
import { useCardAnimation } from '../../../composables/useCardAnimation'

/**
 * Slide the card in when the page loads
 */
useSlideIn('#fully-typed-api')

/**
 * Start the animation when the card is hovered
 */
const { isCardActive, startAnimation } = useCardAnimation(
  '#fully-typed-api',
  undefined,
  {
    once: true,
  },
)
</script>

<template>
  <div
    class="feature-card"
    id="fully-typed-api"
    @mouseover.stop.prevent="startAnimation"
  >
    <div class="feature__visualization" :class="{ active: isCardActive }">
      <div class="ide">
        <span class="code code__inactive">
          <span class="code--red">import</span> { createServer }
          <span class="code--red">from</span>
          <span class="code--blue">'vite'</span><br /><br />
          <span class="code--red">const</span> server =
          <span class="code--red">await</span>
          <span class="code--purple">createServer</span>({<br />
          <span class="code--grey"
            >&nbsp;&nbsp;&nbsp;// user config options</span
          ><br />
          })
        </span>
        <span class="code code__feature">
          <span class="code--red">await</span> server.<span
            class="code--highlight"
            >listen</span
          >()<br />
          <span class="code--extra"
            >server.<span class="code--purple">printUrls</span>()</span
          >
        </span>
      </div>
      <div class="tooltip">
        <span class="code">
          (method) ViteDevServer.<span class="code--blue">listen</span
          >(port<span class="code--blue">?:</span> number
          <span class="code--blue">| undefined,</span> isRestart<span
            class="code--blue"
            >?:</span
          >
          boolean <span class="code--blue">| undefined</span>):
          <span class="code--yellow">Promise</span
          ><span class="code--blue">&lt;</span>ViteDevServer<span
            class="code--blue"
            >&gt;</span
          ><br />
          <span class="code--descriptor">Start the server.</span>
        </span>
      </div>
    </div>
    <div class="feature__meta meta--center">
      <div class="meta__title">Fully typed API</div>
      <div class="meta__description">Designed to be built on top of.</div>
    </div>
  </div>
</template>

<style scoped>
.feature-card {
  @media (min-width: 768px) {
    transform: translate3d(60px, 0, 0);
  }
}

.feature__visualization {
  .ide {
    position: absolute;
    top: 0;
    left: 18px;
    right: 0;
    height: 195px;
    border-radius: 0 0 0 12px;
    overflow: hidden;
    transition: all 0.4s ease-in-out;
    border: 1px solid rgba(64, 64, 64, 0.5);
    border-right: none;
    border-top: none;
    background: linear-gradient(
      to top,
      rgba(23, 23, 23, 0.35) 0%,
      #171717 100%
    );
  }

  .tooltip {
    border-radius: 6px 0 0 6px;
    border: 1px solid #262626;
    background: linear-gradient(-45deg, #1f1f1f 40%, #282828 50%, #1f1f1f 60%);
    background-size: 400%;
    background-position-x: 100%;
    animation: shimmer 7s infinite linear;
    padding: 12px 2px 6px 12px;
    position: absolute;
    z-index: 5;
    top: 25px;
    left: 60px;
    right: 0;
    border-top: 1px solid #383838;
    opacity: 0;
    transition: all 0.2s ease-in-out;
    transform: translate3d(0, 20px, 0);
  }

  .code__inactive {
    opacity: 0.2;
    position: absolute;
    top: 15px;
    left: 15px;
    filter: blur(0);
    transition: all 0.4s ease-in-out;
  }

  .code__feature {
    position: absolute;
    top: 140px;
    left: 15px;
  }

  .code {
    color: #fff;
    text-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
    font-family:
      IBM Plex Mono,
      sans-serif;
    font-size: 11px;
    font-weight: 400;
    line-height: 150%;
    letter-spacing: -0.2px;
    display: block;
    margin: 0;
    user-select: none;
    pointer-events: none;

    .code--highlight {
      display: inline-block;
      position: relative;
      padding: 2px;
      color: #dc94ff;
      transition: all 0.1s ease-in-out;

      &:before {
        content: '';
        width: 100%;
        height: 100%;
        border-radius: 5px;
        opacity: 0;
        background: #94e2fb;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: -1;
        transition: all 0.1s ease-in-out;
      }
    }

    .code--purple {
      color: #dc94ff;
    }

    .code--red {
      color: #ff6b6b;
    }

    .code--blue {
      color: #94e2fb;
    }

    .code--grey {
      color: #737373;
    }

    .code--yellow {
      color: #ffe358;
    }

    .code--descriptor {
      margin-top: 8px;
      padding-top: 6px;
      display: block;
      border-top: 1px solid #363636;
    }

    .code--extra {
      transition: opacity 0.2s ease-in-out;
      opacity: 1;
    }
  }

  &.active {
    .code__inactive {
      filter: blur(5px);
    }

    .code--highlight {
      color: #94e2fb;

      &:before {
        opacity: 0.2;
      }
    }

    .tooltip {
      transition-delay: 0.1s;
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }

    .code--extra {
      opacity: 0.2;
    }
  }
}

@keyframes shimmer {
  to {
    background-position-x: 0;
  }
}
</style>
