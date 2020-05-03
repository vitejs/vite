<template>
  <div class="json">
    {{greeting}}
  </div>
</template>

<script>
import data from './data.json'
export default {
  setup() {
    return data
  }
}
</script>
