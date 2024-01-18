<script setup lang="ts">
import HeroDiagram from './hero-diagram/HeroDiagram.vue'
</script>

<template>
  <div class="hero">
    <div class="container">
      <a
        href="https://viteconf.org/23/replay?utm=vite-homepage"
        class="hero__pill"
        target="_blank"
      >
        <img src="/viteconf.svg" alt="Viteconf logo" width="20" height="20" />
        <span>ViteConf 2023 - watch the replay</span>
      </a>
      <h1>Vite is the next generation of frontend tooling</h1>
      <h3>
        Get ready for a development environment that can finally catch up with
        you.
      </h3>
      <div class="hero__actions">
        <a href="/guide/" class="btn btn--primary">Get started</a>
        <a
          href="https://github.com/vitejs/vite"
          target="_blank"
          class="btn btn--outline"
          ><img src="/github.svg" alt="GitHub logo" width="20" height="20" />
          GitHub</a
        >
      </div>
    </div>
    <div class="hero__glow glow--purple" />
    <div class="hero__glow glow--blue" />
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

.hero__glow {
  &.glow--blue {
    position: absolute;
    left: -60vw;
    width: 110vw;
    aspect-ratio: 1;
    pointer-events: none;
    z-index: -2;
    border-radius: 100%;
    background: linear-gradient(180deg, #61d9ff 0%, rgba(0, 0, 0, 0) 100%);
    filter: blur(30vw);
    transform: none;
    opacity: 0.3;

    @media (min-width: 768px) {
      filter: blur(15vw);
      aspect-ratio: 1.5;
    }

    @media (min-width: 1025px) {
      opacity: 1;
      border-radius: 50% 100% 100% 50%;
      transform: rotate(-5deg) translate3d(0, 10vh, 0);
      left: -5vw;
      width: 40vw;
      aspect-ratio: 3;
      filter: blur(10vw);
      max-width: 700px;
    }

    @media (min-width: 1930px) {
      left: 50%;
      filter: blur(200px);
      transform: rotate(-5deg) translate3d(-100%, 10vh, 0);
    }
  }

  &.glow--purple {
    position: absolute;
    left: 10vw;
    width: 110vw;
    aspect-ratio: 1.2;
    pointer-events: none;
    z-index: -1;
    border-radius: 100%;
    background: linear-gradient(
      270deg,
      #7a23a1 0%,
      rgba(113, 94, 189, 0.9) 60%,
      rgba(113, 94, 189, 0.9) 80%,
      rgba(189, 52, 254, 0) 100%
    );
    filter: blur(30vw);
    transform: none;
    opacity: 0.6;

    @media (min-width: 768px) {
      filter: blur(15vw);
      aspect-ratio: 2;
    }

    @media (min-width: 1025px) {
      opacity: 1;
      left: 15vw;
      width: 80vw;
      aspect-ratio: 4;
      transform: rotate(5deg);
      filter: blur(10vw);
      max-width: 1400px;
    }

    @media (min-width: 1930px) {
      left: 50%;
      filter: blur(200px);
      transform: rotate(-5deg) translate3d(-40%, 0, 0);
    }
  }
}

.hero__actions {
  display: flex;
  flex-direction: row;
  gap: 20px;
}
</style>
