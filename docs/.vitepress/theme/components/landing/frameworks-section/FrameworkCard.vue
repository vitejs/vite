<script setup>
defineProps({
  name: String,
  logo: String | null,
  color: {
    type: String,
    default: '#8974fd',
  },
})
</script>

<template>
  <div class="framework-card" :style="{ '--glow-color': color }">
    <img v-if="logo" :src="logo" :alt="name" />
  </div>
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

  img {
    filter: drop-shadow(
      0 0 0.8rem color-mix(in srgb, var(--glow-color) 50%, transparent)
    );
  }

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
  }

  &:hover {
    &:before {
      opacity: 1;
      transition: opacity 0.2s ease;
    }
  }
}
</style>
