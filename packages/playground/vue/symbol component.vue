<template>
  <h1>import symbol in vue component path:</h1>

  <p>
    symbol assets path in vue template (absolute):
    <img src="./assets/icon copy.png" />
  </p>

  <p>
    symbol assets path in vue template (relative):
    <img src="/icon copy.png" />
  </p>

  <p>
    symbol assets path in vue style (absolute):
    <span class="absolute-symbol assets path"></span>
  </p>

  <p>
    symbol assets path in vue style (relative):
    <span class="relative-symbol"></span>
  </p>
</template>

<style scoped>
.absolute-symbol {
  display: inline-block;
  height: 30px;
  width: 30px;
  background-image: url('./assets/icon copy.png');
  background-size: 30px;
}
.relative-symbol {
  display: inline-block;
  height: 30px;
  width: 30px;
  background-image: url('/icon copy.png');
  background-size: 30px;
}
</style>
