<template>
  <button @click="count++">{{ count }}</button>
  <Child/>
  <Json/>
  <Ts/>
</template>

<script>
import Child from './Child.vue'
import Json from './Json.vue'
import Ts from './Ts.vue'

export default {
  components: { Child, Json, Ts },
  setup() {
    return {
      count: 0
    }
  }
}
</script>
