<template>
  <p :class="$style['css-module']">&lt;css&gt; module</p>
</template>

<style module>
.css-module {
  composes: util-class from './utils.css';
  color: red;
}
</style>
