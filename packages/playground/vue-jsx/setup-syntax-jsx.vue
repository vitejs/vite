<script setup lang="jsx">
import { ref, onMounted, defineProps } from 'vue'

const props = defineProps({
  msg: String
})
onMounted(() => console.log('mounted in vue with jsx2'))
let count = ref(100)
const increment = () => {
  console.log('increase')
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
  <Render />
</template>
