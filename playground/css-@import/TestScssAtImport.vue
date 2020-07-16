<template>
  <h2>CSS Preprocessor @import</h2>
  <div class="sfc-style-scss-at-import">
    &lt;style lang="scss" @import &gt; this should be red
  </div>
  <div class="script-scss-at-import">
    &lt;script scss @import &gt; this should be green
  </div>
</template>

<style lang="scss" scoped>
  @import './testScssAtImportFromStyle.scss';
  .sfc-style-scss-at-import {
    color: $colorSfc;
  }
</style>

<script>
import './testScssAtImportFromScript.scss'

export default {}
</script>
