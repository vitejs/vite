<template>
  <h2>Syntax Support</h2>
  <p class="syntax">{{ a?.b }}</p>
</template>

<script setup>
import { ref } from 'vue'
const foo = {
  bar: 'baz'
}
const a = ref({
  b: foo?.bar
})
</script>
