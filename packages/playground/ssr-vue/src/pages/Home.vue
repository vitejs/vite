<template>
  <h1>Home</h1>
  <p>
    <img src="../assets/logo.png" alt="logo" />
  </p>
  <button @click="state.count++">count is: {{ state.count }}</button>
  <Foo />
  <p class="virtual">msg from virtual module: {{ foo.msg }}</p>
  <p class="inter">this will be styled with a font-face</p>
  <p class="import-meta-url">{{ state.url }}</p>
  <p class="protocol">{{ protocol }}</p>
  <p class="nested-virtual">msg from nested virtual module: {{ virtualMsg }}</p>
  <Button>CommonButton</Button>
  <div>
    encrypted message:
    <p class="encrypted-msg">{{ encryptedMsg }}</p>
  </div>

  <ImportType />
</template>

<script setup>
import foo from '@foo'
import { msg as virtualMsg } from '@virtual-file'
import { reactive, defineAsyncComponent, onMounted, computed } from 'vue'
import Button from '../components/button'

const ImportType = load('ImportType')
const Foo = defineAsyncComponent(() =>
  import('../components/Foo').then((mod) => mod.Foo)
)
function load(file) {
  return defineAsyncComponent(() => import(`../components/${file}.vue`))
}
const url = import.meta.env.SSR
  ? import.meta.url
  : ''

const state = reactive({
  count: 0,
  url
})

const protocol = computed(() => state.url ? new URL(state.url).protocol : '')

onMounted(() => {
  state.url = document.querySelector('.import-meta-url').textContent
})
</script>

<style scoped>
h1,
a {
  color: green;
}
</style>
