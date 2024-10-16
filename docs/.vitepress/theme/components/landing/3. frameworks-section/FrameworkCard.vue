<script setup lang="ts">
import { Ref, ref } from 'vue'

/**
 * A single framework or tool to display in the frameworks section.
 */
export interface Framework {
  /**
   * The name of the framework.
   */
  name?: string

  /**
   * A string representing the URL of the logo in SVG format.
   */
  logo?: string

  /**
   * A string representing the hex color of the glow effect.
   */
  color?: string

  /**
   * A string representing the URL of the framework/tool's homepage.
   */
  url?: string

  /**
   * Whether the framework card is visible or not.
   */
  visible: Ref<boolean>
}

interface Props {
  framework?: Framework
}

const props = withDefaults(defineProps<Props>(), {
  framework: (): Framework => ({
    visible: ref(true),
  }),
})
</script>

<template>
  <component
    :is="props.framework.url ? 'a' : 'div'"
    :href="props.framework.url ? props.framework.url : undefined"
    target="_blank"
    rel="noopener"
    class="framework-card"
    :style="{ '--glow-color': props.framework.color }"
    :class="{ active: props.framework.visible.value === true }"
  >
    <img
      v-if="props.framework.logo"
      :src="props.framework.logo"
      :alt="props.framework.name"
    />
  </component>
</template>

<style scoped>
.framework-card {
  width: 96px;
  height: 96px;
  border-radius: 12px;
  border: 1px solid rgba(38, 38, 38, 0.7);
  background: #181818;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  --glow-color: rgba(0, 0, 0, 0);
  opacity: 0;
  transition: opacity 0.4s ease;
  user-select: none;

  img {
    user-select: none;
    filter: drop-shadow(
      0 0 0.8rem color-mix(in srgb, var(--glow-color) 40%, transparent)
    );
  }

  &.active {
    opacity: 1;
  }
}

.framework-card:not(:has(img)) {
  transform: scale(1) translate3d(0, 0, 0);
  transition: transform 3s ease;

  &:hover {
    transform: scale(0.9) translate3d(0, 0, 0);
    transition: transform 0.2s ease-in-out;
  }
}

.framework-card:has(img) {
  cursor: pointer;
  position: relative;

  &:before {
    content: '';
    position: absolute;
    top: 10%;
    left: 10%;
    right: 10%;
    bottom: 10%;
    background-color: var(--glow-color);
    filter: blur(18px);
    z-index: -1;
    opacity: 0;
    transition: opacity 3s ease;
    will-change: opacity;
  }

  &:hover {
    &:before {
      opacity: 1;
      transition: opacity 0.2s ease;
    }
  }
}
</style>
