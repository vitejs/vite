<template>
  <h2>Template Static Asset Reference</h2>
  <p>
    Relative
    <img class="relative-import" src="./assets/asset.png" style="width: 30px;" />
  </p>
  <p>
    Absolute
    <img class="absolute-import" src="/assets/asset.png" style="width: 30px;" />
  </p>
  <p>
    Absolute import from public dir
    <img class="public-import" src="/icon.png" style="width: 30px;" />
  </p>
</template>