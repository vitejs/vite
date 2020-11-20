<template>
  <h2>Syntax Support</h2>
  <p class="syntax">{{ a?.b }}</p>
</template>

<script setup>
const foo = {
  bar: 'baz'
}
export const a = {
  b: foo?.bar
}
</script>
