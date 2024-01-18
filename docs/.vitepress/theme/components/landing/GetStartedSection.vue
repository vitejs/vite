<script setup></script>

<template>
  <div class="get-started-section">
    <h2>Getting started with Vite</h2>
    <h3>
      Prepare for a development environment that can finally keep pace with your
      expertise.
    </h3>
    <a href="/guide/" class="btn btn--primary">Build now</a>
  </div>
</template>

<style scoped>
.get-started-section {
  margin: 260px auto 190px;
  position: relative;

  h2 {
    color: #fff;
    font-size: 44px;
    font-style: normal;
    font-weight: 600;
    line-height: 120%;
    letter-spacing: -1px;
    margin: 0 auto 20px;
    text-align: center;

    @media (min-width: 768px) {
      font-size: 52px;
    }
  }

  h3 {
    margin: 0 auto 30px;
    color: #d4d4d8;
  }

  .btn {
    margin: 0 auto;
  }
}
</style>
