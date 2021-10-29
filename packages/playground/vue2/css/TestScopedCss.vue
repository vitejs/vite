<template>
  <div>
    <h2>Scoped CSS</h2>
    <div class="style-scoped">
      &lt;style scoped&gt;: only this should be purple
    </div>
  </div>
</template>

<style scoped>
div {
  color: blueviolet;
}
</style>
