<template>
  <p class="sass-with-import">&lt;sass&gt; with import</p>
  <p class="sass-with-import-imported">&lt;sass&gt; with import (imported)</p>
</template>

<style lang="sass">
@import './sassWithImportImported'

.sass-with-import
  color: red
</style>
