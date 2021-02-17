---
home: true
heroImage: /logo.svg
actionText: Get Started
actionLink: /guide/

altActionText: Learn More
altActionLink: /guide/why

features:
  - title: 💡 Instant Server Start
    details: On demand file serving over native ESM, no bundling required!
  - title: ⚡️ Lightning Fast HMR
    details: Hot Module Replacement (HMR) that stays fast regardless of app size.
  - title: 🛠️ Rich Features
    details: Out-of-the-box support for TypeScript, JSX, CSS and more.
  - title: 📦 Optimized Build
    details: Pre-configured Rollup build with multi-page and library mode support.
  - title: 🔩 Universal Plugins
    details: Rollup-superset plugin interface shared between dev and build.
  - title: 🔑 Fully Typed APIs
    details: Flexible programmatic APIs with full TypeScript typing.
footer: MIT Licensed | Copyright © 2019-present Evan You & Vite Contributors
---

<div class="frontpage sponsors">
  <h2>Sponsors</h2>
  <a v-for="{ href, src, name } of sponsors" :href="href" target="_blank" rel="noopener" aria-label="sponsor-img">
    <img :src="src" :alt="name">
  </a>
  <br>
  <a href="https://github.com/sponsors/yyx990803" target="_blank" rel="noopener">Become a sponsor on GitHub</a>
</div>

<script setup>
import sponsors from './.vitepress/theme/sponsors.json'
</script>
