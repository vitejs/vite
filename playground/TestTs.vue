<template lang="pug">
p {{ count }} {{ msg }}
p
  button(@click='count++') increment
</template>

<script lang="ts">
import { foo } from './util'

const log = (foo: string) => foo + Date.now()

export default {
  setup() {
    return {
      count: 0,
      msg: foo() + log('ok!')
    }
  }
}
</script>
