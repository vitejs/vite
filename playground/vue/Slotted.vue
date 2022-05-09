<template>
  <div>
    <h2>:slotted</h2>
    <slot></slot>
  </div>
</template>

<style scoped>
:slotted(div) {
  color: red;
}
</style>
