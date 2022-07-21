<script setup lang="ts">
defineProps<{ svg: string }>()
</script>

<template>
  <figure class="svg-image-root" v-html="svg" />
</template>

<style>
.svg-image-root {
  background-color: #eee;
  border-radius: 8px;
  padding: 1ch;
  margin: 1ch 0;
}
html.dark .svg-image-root {
  background-color: #313641;
}
.svg-image-root svg text {
  font-family: var(--vp-font-family-base);
}
</style>
