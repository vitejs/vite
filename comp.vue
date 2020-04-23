<template>
  <button @click="count++">{{ count }}</button>
</template>

<script>
console.log(12345);
export default {
  data: () => ({ count: 1 })
}
</script>

<style scoped>
button { color: red }
</style>