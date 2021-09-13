<script setup>
let a = $ref(0)
const inc = () => a++
</script>

<template>
  <h2>Ref Transform</h2>
  <button class="ref-transform" @click="inc">{{ a }}</button>
</template>
