<template>
  <h2>Template Static Asset Reference</h2>
  <p>
    Relative
    <img class="relative-import" src="./assets/asset.png" style="width: 30px;" />
  </p>
  <p>
    Absolute
    <!-- note we duplicate the public dir in both playground root and the vue
    sub dir so this should work when served from either root or sub dir -->
    <img src="/public/icon.png" style="width: 30px;" />
  </p>
</template>