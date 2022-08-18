<script>
import { defineComponent, defineAsyncComponent } from 'vue'
import css from './inline.css?inline'

export default defineComponent({
  components: {
    module: defineAsyncComponent(() => import('./module.vue'))
  },
  setup() {
    return {
      css
    }
  }
})
</script>
<template>
  <div class="main">
    <p>Main.vue</p>
    <module />
    <code>
      {{ css }}
    </code>
  </div>
</template>
<style scoped>
.main {
  height: 100vh;
  background: url('@/assets/asset.png') no-repeat;
  background-size: contain;
  background-position: center;
}
</style>
