<script setup>
import HeroDiagram from './HeroDiagram.vue'
</script>

<template>
  <div class="hero">
    <div class="container">
      <!-- ViteConf 2025 Button -->
      <a
        href="https://viteconf.org/?utm=vite"
        class="hero__pill"
        target="_blank"
      >
        <img src="/viteconf.svg" alt="Viteconf logo" width="20" height="20" />
        <span>ViteConf 2025</span>
      </a>

      <!-- Heading -->
      <h1>The Build Tool<br />for the Web</h1>
      <!-- Tagline -->
      <h3>
        Vite is a blazing fast frontend build tool powering the next generation
        of web applications.
      </h3>

      <!-- CTA Buttons -->
      <div class="hero__actions">
        <a href="/guide/" class="btn btn--primary">Get started</a>
        <a
          href="https://github.com/vitejs/vite"
          target="_blank"
          class="btn btn--outline"
        >
          <img src="/github.svg" alt="GitHub logo" width="20" height="20" />
          GitHub
        </a>
      </div>
    </div>

    <!-- Animated Diagram -->
    <HeroDiagram />
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  z-index: 2;
  margin-bottom: 0;
  background-color: #101010;

  @media (min-width: 768px) {
    margin-bottom: 60px;
  }
}

.container {
  display: flex;
  flex-direction: column;
  max-width: 902px;
  margin: 60px auto 0;
  align-items: center;
  position: relative;
  z-index: 2;

  @media (min-width: 768px) {
    margin: 95px auto 0;
  }
}

.hero__pill {
  color: #fff;
  font-family: Inter, sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  letter-spacing: -0.3px;
  display: inline-flex;
  padding: 6px 16px;
  align-items: center;
  gap: 8px;
  border-radius: 100px;
  border: 1px solid rgba(189, 52, 254, 0.5);
  background: radial-gradient(
    1686.42% 113.39% at 83.25% 2.56%,
    rgba(189, 52, 254, 0.1) 0%,
    rgba(189, 52, 254, 0) 100%
  );
  box-shadow: none;
  margin-bottom: 40px;

  @media (min-width: 768px) {
    margin-bottom: 25px;
  }

  span {
    color: #fff;
    font-family: Inter, sans-serif;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    letter-spacing: -0.28px;
  }

  &:hover {
    animation: hero-pill-glow 1600ms ease-out infinite alternate;
  }
}

@keyframes hero-pill-glow {
  0% {
    border-color: rgba(189, 52, 254, 0.5);
    box-shadow:
      0 0 5px rgba(189, 52, 254, 0.01),
      inset 0 0 5px rgba(189, 52, 254, 0.1);
  }
  100% {
    border-color: rgba(189, 52, 254, 0.6);
    box-shadow:
      0 0 20px rgba(189, 52, 254, 0.2),
      inset 0 0 10px rgba(189, 52, 254, 0.2);
  }
}

.hero__actions {
  display: flex;
  flex-direction: row;
  gap: 20px;
  margin-top: 20px;

  @media (min-width: 768px) {
    margin-top: 0;
  }
}
</style>
