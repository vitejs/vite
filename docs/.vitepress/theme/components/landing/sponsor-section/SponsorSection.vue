<script setup>
import { useSponsor } from '../../../composables/sponsor'
import { VPSponsors } from 'vitepress/theme'

const { data } = useSponsor()
</script>

<template>
  <div class="sponsor-section">
    <!-- Title Section -->
    <img
      class="icon-heart"
      src="/heart.svg"
      alt="Vite is made possible by our wonderful sponsors"
      width="58"
      height="55"
    />
    <h2>Free &amp; open source</h2>
    <h4>
      Vite is MIT Licensed and will always be free and open source. This is made
      possible by our wonderful sponsors.
    </h4>

    <!-- Sponsor Grid -->
    <div class="sponsor-grid">
      <VPSponsors v-if="data" :data="data" />
    </div>

    <!-- Sponsorship Actions -->
    <div class="sponsor-actions">
      <a
        href="https://github.com/sponsors/vitejs"
        target="_blank"
        class="btn btn--outline btn--rounded"
        >Sponsor Vite</a
      >
      <a
        href="https://github.com/sponsors/yyx990803"
        target="_blank"
        class="btn btn--outline btn--rounded"
        >Sponsor Evan You</a
      >
    </div>
  </div>
</template>

<style scoped>
.sponsor-section {
  margin-top: 180px;

  .icon-heart {
    margin: 0 auto 10px;
  }

  h2 {
    background: linear-gradient(0deg, #fff 0%, rgba(255, 255, 255, 0.76) 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 auto 10px;
    text-align: center;
  }

  h4 {
    color: #a3a3a3;
    text-align: center;
    font-family: Inter, sans-serif;
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 150%; /* 24px */
    letter-spacing: -0.32px;
    width: 366px;
    max-width: 100%;
    margin: 0 auto;
  }

  .sponsor-grid {
    width: 1200px;
    margin: 40px auto 0;

    @media (max-width: 1240px) {
      width: 100%;
      padding: 0 20px;
    }

    &:deep(.vp-sponsor-tier) {
      color: #fff;
      text-align: center;
      font-family: Inter, sans-serif;
      font-size: 16px;
      font-style: normal;
      font-weight: 500;
      line-height: 150%;
      letter-spacing: -0.32px;
      width: 100%;
      max-width: unset;
      padding: 18px;
      display: block;
      border-radius: 12px;
      border: 1px solid rgba(38, 38, 38, 0.7);
      background: #161616;
      margin: 20px auto;
    }

    &:deep(.vp-sponsor-grid) {
      gap: 20px;
    }

    &:deep(.vp-sponsor-grid-item) {
      border-radius: 12px;
      border: 1px solid rgba(38, 38, 38, 0.7);
      background: #161616;
    }

    &:deep(.vp-sponsor-grid[data-vp-grid='2'] .vp-sponsor-grid-item) {
      width: calc((100% - 20px) / 2);
    }

    &:deep(.vp-sponsor-grid[data-vp-grid='3'] .vp-sponsor-grid-item) {
      width: calc((100% - 20px * 2) / 3);
    }

    &:deep(.vp-sponsor-grid[data-vp-grid='4'] .vp-sponsor-grid-item) {
      width: calc((100% - 20px * 3) / 4);
    }

    &:deep(.vp-sponsor-grid[data-vp-grid='5'] .vp-sponsor-grid-item) {
      width: calc((100% - 20px * 4) / 5);
    }

    &:deep(.vp-sponsor-grid-item .vp-sponsor-grid-image) {
      transition: transform 0.2s ease-in-out;
    }

    &:deep(.vp-sponsor-grid-item:hover .vp-sponsor-grid-image) {
      filter: grayscale(1) invert(1);
      transform: scale(1.05);
    }
  }

  .sponsor-actions {
    margin: 60px auto 0;
    width: fit-content;
    display: flex;
    flex-direction: row;
    gap: 20px;
  }
}
</style>
