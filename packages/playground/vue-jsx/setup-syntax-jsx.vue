<script setup lang="jsx">
import { ref, onMounted, defineProps } from 'vue'

const props = defineProps({
  msg: String
})
onMounted(() => console.log('mounted in vue with jsx2'))
let count = ref(100)
const increment = () => {
  count.value++
}
const Render = () => (
  <div>
    <button onClick={increment}> click!!! </button>hello {props.msg}
    {count.value}
  </div>
)
</script>

<template>
  <p>{{ count }}</p>
  <Render />
</template>

<style scoped>
p {
  color: red;
}
</style>
