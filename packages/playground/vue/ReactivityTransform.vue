<script setup>
const { foo: bar } = defineProps(['foo'])

let a = $ref(0)
const inc = () => a++
</script>

<template>
  <h2>Reactivity Transform</h2>
  <p>Prop foo: {{ bar }}</p>
  <button class="ref-transform" @click="inc">{{ a }}</button>
</template>
