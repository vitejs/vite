<template>
  <h2>Config define</h2>
  <p class="config-define-value">
    <pre>config.define.value: {{ value }}</pre>
  </p>
  <p class="config-define-value-from-js">
    <pre>config.define.value from js: {{ valueFromJS }}</pre>
  </p>
</template>

<script>
import { value } from './test'

export default {
  data() {
    return {
      value: __VALUE__,
      valueFromJS: value
    }
  }
}
</script>
