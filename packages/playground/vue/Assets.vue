<template>
  <h2>Template Static Asset Reference</h2>
  <p>
    Relative
    <img class="relative-import" src="./assets/asset.png" />
  </p>
  <p>
    Absolute
    <img class="absolute-import" src="/assets/asset.png" />
  </p>
  <p>
    Absolute import from public dir
    <img class="public-import" src="/icon.png" />
  </p>
  <p>
    Relative URL in style
    <span class="relative-style-url"></span>
  </p>
  <p>
    SVG Fragment reference
    <img
      class="svg-frag"
      style="width: 32px; height: 32px"
      src="./assets/fragment.svg#icon-heart-view"
      alt=""
    />
  </p>
</template>

<style scoped>
img {
  width: 30px;
}

.relative-style-url {
  display: inline-block;
  height: 30px;
  width: 30px;
  background-image: url('./assets/asset.png');
  background-size: 30px;
}
</style>
