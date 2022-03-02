<template>
  <div class="css-in-less">
    test for import css in less with SFC, color will be yellow
  </div>
  <div class="css-in-less-2">
    test for import less in less with SFC, color will be blue
  </div>
</template>

<script setup></script>

<style lang="less">
@import './nested/css-in-less.less';
</style>
