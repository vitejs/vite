<script setup lang="ts">
defineProps({
  videoId: String,
})
</script>

<template>
  <div class="full-width-youtube-video">
    <iframe
      width="560"
      height="315"
      :src="`https://www.youtube.com/embed/${videoId}`"
      title="YouTube video player"
      frameborder="0"
      allow="
        accelerometer;
        autoplay;
        clipboard-write;
        encrypted-media;
        gyroscope;
        picture-in-picture;
      "
      allowfullscreen
    ></iframe>
  </div>
</template>

<style scoped>
.full-width-youtube-video {
  position: relative;
  padding-bottom: 56.25%;
  height: 0;
}

.full-width-youtube-video iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 0.5rem;
}
</style>
