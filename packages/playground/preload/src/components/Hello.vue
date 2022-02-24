<template>
  <h1>{{ msg }}</h1>
  <div>
    This is <b>hello</b> page.
    <br />
    Go to <router-link to="/">Home</router-link> page
  </div>
</template>

<script setup>
const msg = 'hello'
</script>

<style scoped>
h1 {
  color: red;
}
</style>
