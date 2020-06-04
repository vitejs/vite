<template>
  <h2>CSS @import</h2>
  <div class="sfc-style-at-import">
    &lt;style @import &gt; this should be red
  </div>
  <div class="script-at-import">
    &lt;script @import &gt; this should be green
  </div>
  <h2>CSS Modules @import</h2>
  <div
    class="sfc-style-css-module-at-import"
    :class="$style['sfc-style-css-module-at-import']"
  >
    &lt;style module @import &gt; this should be red
  </div>
  <div
    class="sfc-script-css-module-at-import"
    :class="imported['sfc-script-css-module-at-import']"
  >
    &lt;script module.css @import &gt; this should be green
  </div>
</template>

<style scoped>
@import './testCssAtImportFromStyle.css';
</style>

<style module>
@import './testCssModuleAtImportFromStyle.module.css';
</style>

<script>
import './testCssAtImportFromScript.css'
import imported from './testCssModuleAtImportFromScript.module.css'

export default {
  data: () => ({ imported })
}
</script>
