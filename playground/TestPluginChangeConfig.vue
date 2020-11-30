<template>
  <h2>Change config by plugin</h2>
  <p class="plugin-change-config-1">
  <p>changeConfigPlugin1: {{ changeConfigPlugin1 }}</p>
  </p>
  <p class="plugin-change-config-2">
  <p>changeConfigPlugin2: {{ changeConfigPlugin2 }}</p>
  </p>
</template>

<script>
export default {
  data() {
    return {
      changeConfigPlugin1: __changeConfigPlugin1__,
      changeConfigPlugin2: __changeConfigPlugin2__
    }
  }
}
</script>
