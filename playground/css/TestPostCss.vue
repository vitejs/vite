<template>
  <h2>PostCSS</h2>
  <div class="postcss-from-css">
    CSS import with PostCSS: This should be red
  </div>
  <div class="postcss-from-sfc">
    &lt;style&gt; with PostCSS: This should be green
  </div>
</template>

<script>
import './testPostCss.css'
export default {}
</script>

<style>
body {
  & .postcss-from-sfc {
    color: green;
  }
}
</style>
