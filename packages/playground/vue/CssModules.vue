<template>
  <h2>CSS Modules</h2>
  <div class="sfc-css-modules" :class="$style.blueColor">
    &lt;style module&gt; - this should be blue
    <pre>{{ $style }}</pre>
  </div>
  <div class="sfc-css-modules-with-pre" :class="mod.orangeColor">
    CSS - this should be orange
    <pre>{{ mod }}</pre>
  </div>
</template>

<style module>
.blue-color {
  color: blue;
}
</style>

<style module="mod" lang="scss">
.orange-color {
  color: orange;
}
</style>
