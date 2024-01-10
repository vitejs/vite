<script setup></script>

<template>
  <section class="frameworks-section">
    <h2>Powering your favorite frameworks and tools</h2>
    <div class="frameworks-container">
      <!-- Frameworks go here -->
    </div>
  </section>
</template>

<style scoped>
.frameworks-section {
  margin-top: 150px;

  @media (min-width: 768px) {
    margin-top: 300px;
  }

  h2 {
    background: linear-gradient(0deg, #fff 0%, rgba(255, 255, 255, 0.76) 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    width: 668px;
    max-width: 100%;
    margin: 0 auto;
    text-align: center;
    position: relative;
    z-index: 1;
  }

  .frameworks-container {
    width: 100%;
    height: 600px;
    display: block;
    background-color: rgba(38, 38, 38, 0.15);
    position: relative;
    margin-top: -50px;

    &:before {
      content: '';
      display: block;
      width: 100%;
      height: 80px;
      background: linear-gradient(
        0deg,
        rgba(23, 23, 23, 0) 0%,
        rgba(16, 16, 16, 0.7) 50%,
        #101010 100%
      );
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
    }

    &:after {
      content: '';
      display: block;
      width: 100%;
      height: 80px;
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
}
</style>
