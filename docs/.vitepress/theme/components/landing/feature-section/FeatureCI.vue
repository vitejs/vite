<script setup></script>

<template>
  <div class="feature-card">
    <div class="feature__visualization"></div>
    <div class="feature__meta meta--center">
      <div class="meta__title">Continuous ecosystem integration</div>
      <div class="meta__description">
        Our CI continuously tests Vite changes against downstream projects,
        allowing us to improve Vite with stability and confidence.
      </div>
    </div>
  </div>
</template>

<style scoped>
.feature-card {
  .feature__meta {
    max-width: 500px;
  }
}

.feature__visualization {
}
</style>
