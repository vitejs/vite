<script setup lang="ts">
import { computed, ComputedRef, onMounted, onUnmounted, Ref, ref } from 'vue'
import FrameworkCard, { Framework } from './FrameworkCard.vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Framework assets
import logoAstro from './images/astro.svg'
import logoNuxt from './images/nuxt.svg'
import logoVue from './images/vue.svg'
import logoAnalog from './images/analog.svg'
import logoPlaywright from './images/playwright.svg'
import logoMarko from './images/marko.svg'
import logoStorybook from './images/storybook.svg'
import logoQwik from './images/qwik.svg'
import logoVitest from './images/vitest.svg'
import logoRedwood from './images/redwood.svg'
import logoSolid from './images/solid.svg'
import logoAngular from './images/angular.svg'
import logoReact from './images/react.svg'
import logoRemix from './images/remix.svg'
import logoSvelte from './images/svelte.svg'
import logoLaravel from './images/laravel.svg'
import logoAdonis from './images/adonis.svg'
import logoEmber from './images/ember.svg'
import logoPreact from './images/preact.svg'

/**
 * The frameworks and tools to display in this section.
 */
const frameworks: Framework[] = [
  {
    name: 'Vitest',
    logo: logoVitest,
    color: '#fac52b',
    url: 'https://vitest.dev/',
    visible: ref(false),
  },
  {
    name: 'React',
    logo: logoReact,
    color: '#00d6fd',
    url: 'https://react.dev/',
    visible: ref(false),
  },
  {
    name: 'Angular',
    logo: logoAngular,
    color: '#e03237',
    url: 'https://angular.dev/',
    visible: ref(false),
  },
  {
    name: 'Vue',
    logo: logoVue,
    color: '#40b782',
    url: 'https://vuejs.org/',
    visible: ref(false),
  },
  {
    name: 'Solid',
    logo: logoSolid,
    color: '#75b2df',
    url: 'https://www.solidjs.com/',
    visible: ref(false),
  },
  {
    name: 'Svelte',
    logo: logoSvelte,
    color: '#fd3e00',
    url: 'https://svelte.dev/',
    visible: ref(false),
  },
  {
    name: 'Preact',
    logo: logoPreact,
    color: '#673ab8',
    url: 'https://preactjs.com/',
    visible: ref(false),
  },
  {
    name: 'Astro',
    logo: logoAstro,
    color: '#FFFFFF',
    url: 'https://astro.build',
    visible: ref(false),
  },
  {
    name: 'Remix',
    logo: logoRemix,
    color: '#3991fd',
    url: 'https://remix.run/',
    visible: ref(false),
  },
  {
    name: 'Nuxt',
    logo: logoNuxt,
    color: '#00da81',
    url: 'https://nuxt.com',
    visible: ref(false),
  },
  {
    name: 'Qwik',
    logo: logoQwik,
    color: '#18b5f4',
    url: 'https://qwik.dev/',
    visible: ref(false),
  },
  {
    name: 'Redwood',
    logo: logoRedwood,
    color: '#be4622',
    url: 'https://redwoodjs.com/',
    visible: ref(false),
  },
  {
    name: 'Analog',
    logo: logoAnalog,
    color: '#c10f2e',
    url: 'https://analogjs.org/',
    visible: ref(false),
  },
  {
    name: 'Playwright',
    logo: logoPlaywright,
    color: '#d45247',
    url: 'https://playwright.dev/',
    visible: ref(false),
  },
  {
    name: 'Storybook',
    logo: logoStorybook,
    color: '#fd4684',
    url: 'https://storybook.js.org/',
    visible: ref(false),
  },
  {
    name: 'Marko',
    logo: logoMarko,
    color: '#de2a87',
    url: 'https://markojs.com/',
    visible: ref(false),
  },
  {
    name: 'Laravel',
    logo: logoLaravel,
    color: '#eb4432',
    url: 'https://laravel.com/',
    visible: ref(false),
  },
  {
    name: 'AdonisJS',
    logo: logoAdonis,
    color: '#5a45ff',
    url: 'https://adonisjs.com/',
    visible: ref(false),
  },
  {
    name: 'EmberJS',
    logo: logoEmber,
    color: '#e04e39',
    url: 'https://emberjs.com/',
    visible: ref(false),
  },
]

// Starting parameters
const screenWidth: Ref<number> = ref(1920)
let resizeTimeout: ReturnType<typeof setTimeout> | null = null
let timeline: gsap.core.Timeline | null = null

/**
 * When the resize event fires, update the screen width.
 */
const handleResize = () => {
  screenWidth.value = window.innerWidth
}

/**
 * Throttle the resize event handler.
 */
const throttledResizeHandler = () => {
  if (resizeTimeout === null) {
    resizeTimeout = setTimeout(() => {
      handleResize()
      resizeTimeout = null
    }, 100)
  }
}

onMounted(() => {
  // Set the initial size of the screen
  handleResize()

  // Listen for resize events
  window.addEventListener('resize', throttledResizeHandler)

  // Initialize the GSAP timeline
  timeline = gsap.timeline({
    scrollTrigger: {
      trigger: '#frameworks-section',
      start: 'top 70%',
      once: true,
    },
  })

  frameworks.forEach((framework, index) => {
    timeline!.set(framework.visible, { value: true }, index * 0.05)
  })
})

onUnmounted(() => {
  // Deregister the throttled event handler
  window.removeEventListener('resize', throttledResizeHandler)

  // Clear any pending execution of the resize handler
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
    resizeTimeout = null
  }

  // Kill the GSAP timeline
  if (timeline) {
    timeline.kill()
    timeline = null
  }
})

/**
 * How many total blocks (framework or empty) will fit in a single row?
 */
const numBlocksPerRow: ComputedRef<number> = computed(() => {
  return Math.floor(screenWidth.value / (96 + 24))
})

const paddedBlocksPerSide: ComputedRef<number> = computed(() => {
  if (screenWidth.value < 840) {
    return 0
  }
  if (screenWidth.value < 1280) {
    return 1
  }
  if (screenWidth.value < 1600) {
    return 2
  }
  return Math.max(Math.floor((screenWidth.value - 840) / 280), 0)
})

const numFrameworksPerRow = computed(
  () => numBlocksPerRow.value - paddedBlocksPerSide.value * 2,
)

/**
 * How many rows do we need to display all the frameworks?
 */
const numRows: ComputedRef<number> = computed(() => {
  return Math.ceil(frameworks.length / numFrameworksPerRow.value)
})

/**
 * The indexes of the blocks on each row that support framework cards.
 *
 * Note that the index of the returned array is 1-based.
 */
const centerIndexes: ComputedRef<{ start: number; end: number }[]> = computed(
  () => {
    const firstRowsStartIndex = paddedBlocksPerSide.value
    const frameworksPerFirstRows =
      numBlocksPerRow.value - 2 * paddedBlocksPerSide.value
    const lastRowStartIndex =
      paddedBlocksPerSide.value +
      Math.floor(
        (frameworksPerFirstRows -
          (frameworks.length % frameworksPerFirstRows)) /
          2,
      )
    return new Array(numRows.value + 1).fill(0).map((_, i) => {
      return i < numRows.value ||
        frameworks.length % frameworksPerFirstRows === 0
        ? {
            start: firstRowsStartIndex,
            end: numBlocksPerRow.value - paddedBlocksPerSide.value,
          }
        : {
            start: lastRowStartIndex,
            end:
              lastRowStartIndex +
              (frameworks.length % frameworksPerFirstRows) +
              1,
          }
    })
  },
)

/**
 * Generate CSS transformations for each row, to gracefully slide between horizontal positions.
 */
const rowStyle: ComputedRef<{ transform: string }> = computed(() => {
  return {
    transform: `translate3d(var(--row-offset), 0, 0)`,
  }
})
</script>

<template>
  <section class="frameworks-section" id="frameworks-section">
    <h2>Powering your favorite frameworks and tools</h2>
    <div class="frameworks-container">
      <!-- Top Row -->
      <div class="framework-row" :style="rowStyle">
        <FrameworkCard v-for="i in numBlocksPerRow + 2" />
      </div>

      <!-- Logo Rows -->
      <template v-for="rowIndex in numRows">
        <div class="framework-row" :style="rowStyle">
          <template v-for="columnIndex in numBlocksPerRow + 2">
            <template
              v-if="
                columnIndex - 1 >= centerIndexes[rowIndex].start &&
                columnIndex - 1 < centerIndexes[rowIndex].end
              "
            >
              <FrameworkCard
                :framework="
                  frameworks[
                    (rowIndex - 1) * numFrameworksPerRow +
                      (columnIndex - 1) -
                      centerIndexes[rowIndex].start
                  ]
                "
              />
            </template>
            <template v-else>
              <FrameworkCard />
            </template>
          </template>
        </div>
      </template>

      <!-- Bottom Row -->
      <div class="framework-row" :style="rowStyle">
        <FrameworkCard v-for="i in numBlocksPerRow + 2" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.frameworks-section {
  margin-top: 150px;

  @media (min-width: 768px) {
    margin-top: 240px;
  }

  h2 {
    background: linear-gradient(0deg, #fff 0%, rgba(255, 255, 255, 0.76) 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    width: 668px;
    max-width: 100%;
    margin: 0 auto;
    text-align: center;
    position: relative;
    z-index: 3;
  }

  .frameworks-container {
    width: 100%;
    background-color: rgba(38, 38, 38, 0.15);
    position: relative;
    margin-top: -20px;
    overflow: hidden;

    @media (min-width: 840px) {
      mask-image: linear-gradient(
        90deg,
        transparent 0%,
        #ffffff 300px,
        #ffffff calc(100vw - 300px),
        transparent 100%
      );
    }

    &:before {
      content: '';
      display: block;
      width: 100%;
      height: 80px;
      background: linear-gradient(
        0deg,
        rgba(23, 23, 23, 0) 0%,
        rgba(16, 16, 16, 0.7) 50%,
        #101010 100%
      );
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: 2;
      pointer-events: none;
    }

    &:after {
      content: '';
      display: block;
      width: 100%;
      height: 100px;
      background: linear-gradient(
        180deg,
        rgba(23, 23, 23, 0) 0%,
        rgba(16, 16, 16, 0.7) 50%,
        #101010 100%
      );
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 2;
      pointer-events: none;
    }
  }

  .framework-row {
    display: grid;
    grid-auto-columns: 96px;
    grid-gap: 24px;
    justify-content: flex-start;
    margin-bottom: 24px;
    position: relative;
    white-space: nowrap;
    grid-auto-flow: column;

    &:nth-child(even) {
      --row-offset: 36px;
    }

    &:nth-child(odd) {
      --row-offset: 12px;
    }

    @media (min-width: 1080px) {
      &:nth-child(even) {
        --row-offset: 24px;
      }

      &:nth-child(odd) {
        --row-offset: -24px;
      }
    }
  }
}
</style>
