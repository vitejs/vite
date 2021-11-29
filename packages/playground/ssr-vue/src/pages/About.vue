<template>
  <h1>{{ msg }}</h1>
  <p class="import-meta-url">{{ url }}</p>
  <Button>DynamicButton</Button>
</template>

<script>
import { Button } from 'vant'
import 'vant/lib/index.css'

export default {
  async setup() {
    const url = import.meta.env.SSR
      ? import.meta.url
      : document.querySelector('.import-meta-url').textContent
    return {
      msg: 'About',
      url
    }
  },
  components: {
    Button
  }
}
</script>

<style scoped>
h1 {
  color: red;
}
</style>
