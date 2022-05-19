<template>
  <p class="css">&lt;css&gt;</p>
  <p :class="$style['css-module']">&lt;css&gt; module</p>
  <p class="css-scoped">&lt;css&gt; scoped</p>
  <p class="css-scoped-nested">&lt;css&gt; scoped with nested</p>
</template>

<style>
.css {
  color: red;
}
</style>

<style module>
.css-module {
  color: red;
}
</style>

<style scoped>
.css-scoped {
  color: red;
}
</style>

<style scoped>
.css-scoped-nested {
  color: red;
  .dummy {
    color: green;
  }
  font-weight: bold;
}
</style>
