<template>
  <div>
    <h1 class="title">Hello Vite + Vue 3!</h1>
    <p>Count: {{ count }}</p>
    <button @click="count++">Increment</button>
  </div>
</template>

<script>
export default {
  data: () => ({ count: 0 })
}
</script>

<style scoped>
h1 {
  font-size: 2rem;
  color: #4fc08d;
}
h1,
p {
  text-align: center;
  font-family: Arial, Helvetica, sans-serif;
}

button {
  margin: 0 auto;
  display: block;
  padding: 0.5rem 0.75rem;
}
</style>
