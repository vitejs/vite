<script setup lang="ts">
export interface Testimonial {
  /**
   * The URL to the avatar image.
   */
  avatar: string

  /**
   * The name of the Vite user.
   */
  name: string

  /**
   * Their social media handle.
   */
  handle: string

  /**
   * Their comment/testimonial about Vite.
   */
  comment: string[]
}

defineProps<{
  /**
   * A testimonial from a Vite user.
   */
  testimonial: Testimonial
}>()
</script>

<template>
  <div class="community-card">
    <div class="card__header">
      <img
        :src="testimonial.avatar"
        :alt="testimonial.name"
        class="card__avatar"
      />
      <div class="card__meta">
        <span class="card__name">
          {{ testimonial.name }}
        </span>
        <span class="card__handle">
          {{ testimonial.handle }}
        </span>
      </div>
    </div>
    <div class="card__content">
      <p v-for="p of testimonial.comment">{{ p }}</p>
    </div>
  </div>
</template>

<style scoped>
.community-card {
  break-inside: avoid;
  width: 100%;
  margin-bottom: 25px;
  border-radius: 12px;
  border: 1px solid rgba(38, 38, 38, 0.7);
  background: #161616;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .card__avatar {
    width: 48px;
    aspect-ratio: 1;
    border-radius: 100%;
  }

  .card__content {
    color: #a3a3a3;
    font-family: Inter, sans-serif;
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 150%;
    letter-spacing: -0.32px;
    text-wrap: pretty;
    cursor: default;
  }

  .card__content p {
    margin-top: 10px;
  }

  .card__header {
    display: flex;
    flex-direction: row;
    gap: 20px;
    align-items: center;
  }

  .card__meta {
    display: flex;
    flex-direction: column;
  }

  .card__name {
    color: #fff;
    font-family: Inter, sans-serif;
    font-size: 16px;
    font-style: normal;
    font-weight: 500;
    line-height: 150%;
    letter-spacing: -0.3px;
  }

  .card__handle {
    color: #a3a3a3;
    font-family: Inter, sans-serif;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 150%;
    letter-spacing: -0.3px;
  }
}
</style>
