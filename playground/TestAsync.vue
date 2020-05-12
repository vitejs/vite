<template>
  <div class="async">This should show up...</div>
  <div>Loaded in {{ time }}ms.</div>
</template>

<script>
export default {
  data() {
    return { time: performance.now().toFixed(2) }
  }
}
</script>
