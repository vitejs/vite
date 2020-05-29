<template>
  <h2>CSS @import</h2>
  <div class="sfc-style-at-import">
    &lt;style @import &gt; this should be red
  </div>
  <div class="script-at-import">
    &lt;script @import &gt; this should be green
  </div>
</template>

<style scoped>
@import './testCssAtImportFromStyle.css';
</style>

<script>
import './testCssAtImportFromScript.css'

export default {}
</script>
