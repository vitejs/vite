<template>
  <h2>import symbol in vue component:</h2>
  <p>import symbol in vue component path: ok</p>
  <p>
    symbol assets path in vue template (absolute):
    <img src="/@/assets/asset copy.png" width="30" />
  </p>

  <p>
    symbol assets path in vue template (relative):
    <img src="/icon copy.png" />
  </p>

  <p>
    symbol assets path in vue style (absolute):
    <span class="absolute-symbol-vue"></span>
  </p>

  <p>
    symbol assets path in vue style (relative):
    <span class="relative-symbol-vue"></span>
  </p>
  {{ string }}
</template>
<script setup>
import string from 'resolve virtual module'
</script>
<style scoped>
.absolute-symbol-vue {
  display: inline-block;
  height: 30px;
  width: 30px;
  border: 1px solid #0088ff;
  background-image: url('./assets/asset copy.png');
  background-size: 30px;
}
.relative-symbol-vue {
  display: inline-block;
  height: 30px;
  width: 30px;
  border: 1px solid #0088ff;
  background-image: url('/icon copy.png');
  background-size: 30px;
}
</style>
