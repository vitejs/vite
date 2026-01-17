<script setup>
import { ref } from 'vue'
import ViteLogo from './ViteLogo.vue'
import heroImg from '../assets/hero.png'
import vueLogo from '../assets/vue.svg'
import documentationIcon from '../assets/documentation-icon.svg'
import socialIcon from '../assets/social-icon.svg'
import githubIcon from '../assets/github-icon.svg'
import discordIcon from '../assets/discord-icon.svg'
import blueskyIcon from '../assets/bluesky-icon.svg'
import xIcon from '../assets/x-icon.svg'

const count = ref(0)
</script>

<template>
  <section id="center">
    <div class="hero-image">
      <img :src="heroImg" alt="Vite" class="hero-image__base" />
      <img :src="vueLogo" class="hero-image__framework" alt="Vue logo" />
      <span class="hero-image__vite" aria-label="Vite logo"><ViteLogo /></span>
    </div>
    <div>
      <h1>Get started</h1>
      <p>Edit <code>src/App.vue</code> and save to test <code>HMR</code></p>
    </div>
    <button class="counter" @click="count++">Count is {{ count }}</button>
  </section>

  <div class="ticks"></div>

  <section id="next-steps">
    <div id="documentation">
      <img class="icon" :src="documentationIcon" alt="Documentation" />
      <h2>Documentation</h2>
      <p>Your questions, answered</p>
      <div class="button-group">
        <a href="https://vite.dev/?ref=vite-starter-learn-more" class="button"
          ><span class="button-logo"><ViteLogo /></span>Explore Vite</a
        >
        <a href="https://vuejs.org/?ref=vite-starter-learn-more" class="button"
          ><img :src="vueLogo" alt="" />Learn more</a
        >
      </div>
    </div>
    <div id="social">
      <img class="icon" :src="socialIcon" alt="Connect with us" />
      <h2>Connect with us</h2>
      <p>Join the Vite community</p>
      <ul>
        <li>
          <a
            href="https://github.com/vitejs/vite?ref=vite-starter-icon"
            target="_blank"
            ><img :src="githubIcon" alt="GitHub" />GitHub</a
          >
        </li>
        <li>
          <a href="https://chat.vite.dev/?ref=vite-starter-icon" target="_blank"
            ><img :src="discordIcon" alt="Discord" />Discord</a
          >
        </li>
        <li>
          <a href="https://x.com/vite_js?ref=vite-starter-icon" target="_blank"
            ><img :src="xIcon" alt="X" />X.com</a
          >
        </li>
        <li>
          <a
            href="https://bsky.app/profile/vite.dev?ref=vite-starter-icon"
            target="_blank"
            ><img :src="blueskyIcon" alt="Bluesky" />Bluesky</a
          >
        </li>
      </ul>
    </div>
  </section>

  <div class="ticks"></div>
  <section id="spacer"></section>
</template>
