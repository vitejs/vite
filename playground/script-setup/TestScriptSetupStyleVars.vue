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
import { ref, defineOptions } from 'vue'
import TestScriptSetupChild from './TestScriptSetupChild.vue'

defineOptions({
  props: {
    msg: String
  }
})

const color = ref('red')

function change() {
  color.value = color.value === 'red' ? 'green' : 'red'
}
</script>

<style>
span {
  color: v-bind(color);
}
</style>
