<template>
  <div class="async">This should show up... and be brown</div>
  <div>Loaded in {{ time }}ms.</div>
</template>

<script>
export default {
  data() {
    return { time: performance.now().toFixed(2) }
  }
}
</script>

<style scoped>
.async {
  color: #8B4513;
}
</style>
