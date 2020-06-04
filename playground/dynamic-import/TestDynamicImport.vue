<template>
  <h2>Dynamic Import with Variables</h2>
  <component v-for="view of views" :is="view" />
</template>

<script>
import { defineAsyncComponent } from 'vue'
const views = ['One', 'Two']

const components = views.reduce((comps, name) => {
  comps[name] = defineAsyncComponent(() => import(`./views/${name}.vue`))
  return comps
}, {})

export default {
  components,
  data() {
    return {
      views
    }
  }
}
</script>
