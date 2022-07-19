<script setup lang="ts">
defineProps<{ svg: string }>()
</script>

<template>
  <figure class="svg-image-root" v-html="svg" />
</template>

<style>
.svg-image-root {
  background-color: #eee;
  border: solid 1px #ccc;
  border-radius: 8px;
  padding: 1ch;
  margin: 1ch 0;
}
html.dark .svg-image-root {
  background-color: #313641;
}
</style>
