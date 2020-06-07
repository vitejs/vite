<template>
  <h2>Static Asset HMR W/ Script Import</h2>
  <img class="asset-hmr-script" :src="filepath">
</template>
<script>
  import filepath from '/logo.svg'
  export default {
    data() {
      return {
        filepath
      }
    }
  }
</script>
