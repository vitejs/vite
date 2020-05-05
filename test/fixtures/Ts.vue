<template>
  <div class="ts">
    {{data}}
  </div>
</template>

<script lang="ts">
  import {data} from './data'
  export default {
    setup() {
      return {data}
    }
  }
</script>
