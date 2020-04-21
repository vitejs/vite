<template>
  <button @click="count++">{{ count }}</button>
  <Child/>
</template>

<script>
import Child from './Child.vue'

export default {
  components: { Child },
  setup() {
    return {
      count: 0
    }
  }
}
</script>
