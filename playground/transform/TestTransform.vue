<template>
  <h2>Transforms</h2>
  <div class="transform-scss">This should be cyan</div>
  <div class="transform-js">{{ transformed }}</div>
</template>

<script>
import './testTransform.scss'
import { __TEST_TRANSFORM__ } from './testTransform.js'

export default {
  data() {
    return {
      transformed: __TEST_TRANSFORM__
    }
  }
}
</script>
