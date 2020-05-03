<template>
  <button @click="count++">{{ count }}</button>
  <Child/>
  <Json/>
</template>

<script>
import Child from './Child.vue'
import Json from './Json.vue'

export default {
  components: { Child, Json },
  setup() {
    return {
      count: 0
    }
  }
}
</script>
