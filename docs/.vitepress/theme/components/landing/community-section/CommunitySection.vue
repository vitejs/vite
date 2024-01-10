<script setup></script>

<template>
  <section class="community-section">
    <h2>Join the community</h2>
    <h3>
      Supported by a network of early advocates, contributors, and champions.
    </h3>
    <div class="community-grid-container">
      <div class="community-grid">
        <div
          class="community-card"
          v-for="i in 15"
          :style="{ height: Math.max(Math.random() * 400, 150) + 'px' }"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.community-section {
  margin-top: 100px;
  display: none;

  @media (min-width: 768px) {
    display: block;
  }

  h2 {
    background: linear-gradient(0deg, #fff 0%, rgba(255, 255, 255, 0.76) 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 auto 10px;
    text-align: center;
  }

  h3 {
    width: 455px;
    max-width: 100%;
    margin: 0 auto;
    text-align: center;
  }

  .community-grid-container {
    overflow: hidden;
    max-height: 800px;
    position: relative;

    &:after {
      content: '';
      display: block;
      width: 100%;
      height: 150px;
      background: linear-gradient(
        180deg,
        rgba(23, 23, 23, 0) 0%,
        rgba(16, 16, 16, 0.7) 50%,
        #101010 100%
      );
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
    }
  }

  .community-grid {
    column-count: 2;
    column-gap: 25px;
    width: calc(100% - 50px);
    margin: 40px auto 0;

    @media (min-width: 1150px) {
      column-count: 3;
      width: 1100px;
    }
  }

  .community-card {
    break-inside: avoid;
    width: 100%;
    margin-bottom: 25px;
    border-radius: 12px;
    border: 1px solid #171717;
    background: rgba(38, 38, 38, 0.25);
  }
}
</style>
