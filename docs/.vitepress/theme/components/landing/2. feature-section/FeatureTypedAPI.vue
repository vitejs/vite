<script setup lang="ts">
import { nextTick, onMounted, ref, Ref } from 'vue'
import { gsap } from 'gsap'
import { useSlideIn } from '../../../composables/useSlideIn'
import { useCardAnimation } from '../../../composables/useCardAnimation'

/**
 * Slide the card in when the page loads
 */
useSlideIn('#fully-typed-api')

/**
 * Start the animation when the card is hovered
 */
const { isCardActive } = useCardAnimation('#fully-typed-api')
</script>

<template>
  <div class="feature-card" id="fully-typed-api">
    <div class="feature__visualization" :class="{ active: isCardActive }">
      <div class="ide">
        <span class="code code__inactive">
          <span class="code--blue">import</span> ‘.../nested/main’<br />
          <span class="code--blue">import</span> ‘.../nested/....’<br />
          <span class="code--blue">import</span> ‘.../nested/....’<br />
          <span class="code--blue">import</span> ‘.../nested/....’<br />
          <br />
          <span class="code--blue">import</span> ‘.../nested/main’<br />
          <span class="code--blue">import</span> ‘.../nested/....’<br />
          <span class="code--blue">import</span> ‘.../nested/....’<br />
        </span>
        <span class="code code__feature">
          <span class="code--grey">import { </span
          ><span class="code--highlight">createServer</span
          ><span class="code--grey"> } from ‘</span
          ><span class="code--yellow">vite</span
          ><span class="code--grey">’</span>
        </span>
      </div>
      <div class="tooltip">
        <span class="code">
          (alias) <span class="code--purple">function</span
          ><br />createServer(inlineConfig?:
          <span class="code--yellow">InlineConfig</span>):
          <span class="code--yellow">Promise</span>&lt;<span
            class="code--yellow"
            >ViteDevServer</span
          >&gt;<br /><span class="code--blue">import </span> createServer
        </span>
      </div>
    </div>
    <div class="feature__meta meta--center">
      <div class="meta__title">Fully typed API</div>
      <div class="meta__description">
        Vite's JavaScript APIs are fully typed.
      </div>
    </div>
  </div>
</template>

<style scoped>
.feature-card {
  transform: translate3d(60px, 0, 0);
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
    padding: 12px 2px 12px 12px;
    position: absolute;
    z-index: 5;
    top: 48px;
    left: 90px;
    right: 0;
    border-top: 1px solid #383838;
    opacity: 0;
    transition: all 0.2s ease-in-out;
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
    top: 160px;
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

      &:before {
        content: '';
        width: 100%;
        height: 100%;
        border-radius: 5px;
        opacity: 0.2;
        background: #ffe358;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: -1;
      }
    }

    .code--purple {
      color: #dc94ff;
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
  }

  &.active,
  &:hover {
    .code__inactive {
      filter: blur(5px);
    }

    .tooltip {
      transition-delay: 0.1s;
      opacity: 1;
    }
  }
}

@keyframes shimmer {
  to {
    background-position-x: 0;
  }
}
</style>
