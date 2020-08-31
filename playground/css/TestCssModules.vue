<template>
  <h2>CSS Modules</h2>
  <div class="css-modules-sfc" :class="$style.blueColor">
    &lt;style module&gt; - this should be blue
  </div>
  <div class="css-modules-import" :class="turquoiseColor">
    CSS modules import - this should be orange
  </div>
  <div class="scss-modules-import" :class="importedScss.magenta">
    SCSS modules import - this should be magenta
  </div>
</template>

<script>
import { turquoiseColor } from './testCssModules.module.css'
import importedScss from './testScssModules.module.scss';

export default {
  data: () => ({ importedScss, turquoiseColor })
}
</script>

<style module>
.blue-color {
  color: blue;
}
</style>
