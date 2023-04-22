<template>
  <div id="helloroot" class="bg-red-400 text-gray-800">
    HelloWorld - {{ count }}
  </div>
</template>

<script setup lang="ts">
import { INITIAL_COUNT } from '../utils.ts'
const count = INITIAL_COUNT
</script>
