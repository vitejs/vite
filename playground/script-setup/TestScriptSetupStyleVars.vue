<template>
  <h2>Script Setup + CSS Variables Injection</h2>
  <p class="script-setup-props">{{ msg }}</p>
  <p>
    <span class="style-vars">This should be red</span>
    <button class="script-setup-change" @click="change">click to change</button>
  </p>
  <TestScriptSetupChild msg="hello"/>
</template>

<script setup>
import { ref } from 'vue'
export { default as TestScriptSetupChild } from './TestScriptSetupChild.vue'

export default {
  props: {
    msg: String
  }
}

export const color = ref('red')

export function change() {
  color.value = color.value === 'red' ? 'green' : 'red'
}

</script>

<style scoped vars="{ color }">
span {
  color: var(--color);
}
</style>
