<template>
  <Async />
</template>

<script setup>
import { defineAsyncComponent } from 'vue'

const Async = defineAsyncComponent(() => import('./Async.vue'))
</script>