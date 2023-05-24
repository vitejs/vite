<!--
https://github.com/vuejs/core/issues/8171
https://github.com/vitejs/vite-plugin-vue/issues/162
generic attribute includes angle brackets which breaks scanning
This file only verifies that the scanner can work with such usage and nothing
else.
-->

<script lang="ts">
export class Item<TValue> {
  value: TValue
}
</script>

<script setup lang="ts" generic="TItem extends Item<TValue>, TValue">
defineProps<{
  items: TItem[]
  modelValue: TItem[]
}>()
</script>

<template>{{ items }}</template>
