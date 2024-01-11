<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import logoAstro from '../../../../../images/frameworks/astro.svg'
import logoNuxt from '../../../../../images/frameworks/nuxt.svg'
import logoVue from '../../../../../images/frameworks/vue.svg'
import logoAnalog from '../../../../../images/frameworks/analog.svg'
import logoPlaywright from '../../../../../images/frameworks/playwright.svg'
import logoMarko from '../../../../../images/frameworks/marko.svg'
import logoStorybook from '../../../../../images/frameworks/storybook.svg'
import logoQwik from '../../../../../images/frameworks/qwik.svg'
import logoVitest from '../../../../../images/frameworks/vitest.svg'
import logoRedwood from '../../../../../images/frameworks/redwood.svg'
import logoSolid from '../../../../../images/frameworks/solid.svg'
import logoAngular from '../../../../../images/frameworks/angular.svg'
import logoReact from '../../../../../images/frameworks/react.svg'
import logoSvelte from '../../../../../images/frameworks/svelte.svg'
import FrameworkCard from './FrameworkCard.vue'

/**
 * The frameworks and tools to display in this section.
 */
const frameworks = [
  {
    name: 'Astro',
    logo: logoAstro,
    color: '#FFFFFF',
  },
  {
    name: 'Nuxt',
    logo: logoNuxt,
    color: '#00da81',
  },
  {
    name: 'Vue',
    logo: logoVue,
    color: '#40b782',
  },
  {
    name: 'Analog',
    logo: logoAnalog,
    color: '#c10f2e',
  },
  {
    name: 'Playwright',
    logo: logoPlaywright,
    color: '#d45247',
  },
  {
    name: 'Marko',
    logo: logoMarko,
    color: '#de2a87',
  },
  {
    name: 'Storybook',
    logo: logoStorybook,
    color: '#fd4684',
  },
  {
    name: 'Qwik',
    logo: logoQwik,
    color: '#18b5f4',
  },
  {
    name: 'Vitest',
    logo: logoVitest,
    color: '#fac52b',
  },
  {
    name: 'Redwood',
    logo: logoRedwood,
    color: '#be4622',
  },
  {
    name: 'Solid',
    logo: logoSolid,
    color: '#75b2df',
  },
  {
    name: 'Angular',
    logo: logoAngular,
    color: '#e03237',
  },
  {
    name: 'React',
    logo: logoReact,
    color: '#00d6fd',
  },
  {
    name: 'Svelte',
    logo: logoSvelte,
    color: '#fd3e00',
  },
]

const screenWidth = ref(window.innerWidth)

const handleResize = () => {
  screenWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

/**
 * How many total blocks (framework or empty) will fit in a single row?
 */
const numBlocksPerRow = computed(() => {
  return Math.floor(screenWidth.value / (96 + 24))
})

/**
 * How many framework blocks will fit in a single row?
 * The most we support for our layout is 7, but it can be less for narrower screens.
 */
const numFrameworksPerRow = computed(() => {
  return Math.min(numBlocksPerRow.value, 7)
})

/**
 * How many rows do we need to display all the frameworks?
 */
const numRows = computed(() => {
  return Math.ceil(frameworks.length / numFrameworksPerRow.value)
})

/**
 * The indexes of the blocks on each row that support framework cards.
 */
const centerIndexes = computed(() => {
  if (numBlocksPerRow.value === numFrameworksPerRow.value) {
    return {
      start: 1,
      end: numBlocksPerRow.value + 1,
    }
  }
  const startIndex = Math.max(
    Math.ceil(numBlocksPerRow.value / 2) -
      Math.floor(frameworks.length / (numRows.value * 2)),
    0,
  )
  return {
    start: startIndex,
    end: startIndex + Math.floor(frameworks.length / numRows.value),
  }
})

/**
 * Generate CSS transformations for each row, to gracefully slide between horizontal positions.
 */
const rowStyle = computed(() => {
  if (numBlocksPerRow.value % 2 === 0) {
    return {
      transform: `translate3d(calc(((100% - ${
        numBlocksPerRow.value * (96 + 24)
      }px) / 1) + var(--row-offset)), 0, 0)`,
    }
  } else {
    return {
      transform: `translate3d(var(--row-offset), 0, 0)`,
    }
  }
})
</script>

<template>
  <section class="frameworks-section">
    <h2>Powering your favorite frameworks and tools</h2>
    <div class="frameworks-container">
      <!-- Top Row -->
      <div class="framework-row" :style="rowStyle">
        <FrameworkCard v-for="i in numBlocksPerRow" />
      </div>

      <!-- Logo Rows -->
      <template v-for="rowIndex in numRows">
        <div class="framework-row" :style="rowStyle">
          <template v-for="columnIndex in numBlocksPerRow">
            <template
              v-if="
                columnIndex >= centerIndexes.start &&
                columnIndex < centerIndexes.end
              "
            >
              <FrameworkCard
                v-bind="
                  frameworks[
                    (rowIndex - 1) * numFrameworksPerRow +
                      columnIndex -
                      centerIndexes.start
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
        <FrameworkCard v-for="i in numBlocksPerRow" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.frameworks-section {
  margin-top: 150px;

  @media (min-width: 768px) {
    margin-top: 300px;
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
    margin-top: -40px;
    overflow: hidden;

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
    grid-template-columns: repeat(auto-fill, 96px);
    grid-gap: 24px;
    justify-content: flex-start;
    margin-bottom: 24px;
    position: relative;

    &:nth-child(even) {
      --row-offset: 24px;
    }

    &:nth-child(odd) {
      --row-offset: -24px;
    }
  }
}
</style>
