<template>
  <h2>@Import CSS Boundary</h2>
  <div class="style-at-import">
    &lt;style @import &gt;: only this should be red
  </div>
  <div class="style-at-import-scss">
    &lt;style @import scss &gt;: only this should be red
  </div>
  <div id="css-modules-at-import-sfc" :class="$style['css-modules-at-import-sfc']">
    &lt;style module&gt; @import - this should be red
  </div>
</template>

<style scoped>
  @import "./testCssImportBoundary.css";
</style>

<style lang="scss" scoped>
  @import "./testCssImportBoundary.scss";
  .style-at-import-scss {
    color: $scssImport;
  }
</style>


<style lang="scss" module>
  @import "./testCssImportBoundary.scss";
  .css-modules-at-import-sfc {
    color: $scssImport;
  }
</style>
