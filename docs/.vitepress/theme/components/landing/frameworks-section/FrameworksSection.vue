<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

/**
 * The frameworks and tools to display in this section.
 */
const frameworks = [
  {
    name: 'Vue',
  },
  {
    name: 'Astro',
  },
  {
    name: 'Nuxt',
  },
  {
    name: 'Vue',
  },
  {
    name: 'Astro',
  },
  {
    name: 'Nuxt',
  },
  {
    name: 'Vue',
  },
  {
    name: 'Astro',
  },
  {
    name: 'Nuxt',
  },
  {
    name: 'Vue',
  },
  {
    name: 'Astro',
  },
  {
    name: 'Nuxt',
  },
  {
    name: 'Vue',
  },
  {
    name: 'Astro',
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
 * How many total blocks will be drawn to fill the screen.
 */
const numBlocks = computed(() => {
  return Math.floor(screenWidth.value / (96 + 24))
})

/**
 * The indexes of the frameworks to display in the center of the screen.
 */
const centerIndexes = computed(() => {
  const startIndex =
    Math.floor(numBlocks.value / 2) - Math.floor(frameworks.length / 4)
  return {
    start: startIndex,
    end: startIndex + frameworks.length / 2,
  }
})
</script>

<template>
  <section class="frameworks-section">
    <h2>Powering your favorite frameworks and tools</h2>
    <div class="frameworks-container">
      <!-- Top Row -->
      <div class="framework-row">
        <div class="framework-block" v-for="i in numBlocks"></div>
      </div>

      <!-- Logo Rows -->
      <div class="framework-row">
        <template v-for="i in numBlocks">
          <template v-if="i > centerIndexes.start && i <= centerIndexes.end">
            <div class="framework-block active">
              <img src="/logo.svg" alt="FRAMEWORK NAME" />
            </div>
          </template>
          <template v-else>
            <div class="framework-block" />
          </template>
        </template>
      </div>

      <!-- Bottom Row -->
      <div class="framework-row">
        <div class="framework-block" v-for="i in numBlocks"></div>
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
    height: 450px;
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
    }

    &:after {
      content: '';
      display: block;
      width: 100%;
      height: 80px;
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
    }
  }

  .framework-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, 96px);
    grid-gap: 24px;
    justify-content: center;
    margin-bottom: 24px;
    position: relative;

    &:nth-child(odd) {
      transform: translate3d(-48px, 0, 0);
    }

    &:nth-child(even) {
      transform: translate3d(24px, 0, 0);
    }
  }

  .framework-block {
    width: 96px;
    aspect-ratio: 1;
    border-radius: 12px;
    border: 1px solid rgba(38, 38, 38, 0.7);
    background: rgba(38, 38, 38, 0.25);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 24px;

    &.active {
      cursor: pointer;
    }
  }
}
</style>
