<script>
  import svelteLogo from './assets/svelte.svg'
  import viteLogo from './assets/vite.svg'
  import heroImg from './assets/hero.png'
  import documentationIcon from './assets/documentation-icon.svg'
  import socialIcon from './assets/social-icon.svg'
  import githubIcon from './assets/github-icon.svg'
  import discordIcon from './assets/discord-icon.svg'
  import blueskyIcon from './assets/bluesky-icon.svg'
  import xIcon from './assets/x-icon.svg'
  import Counter from './lib/Counter.svelte'
</script>

<section id="framework-logos">
  <a href="https://vite.dev" target="_blank" rel="noreferrer">
    <img src={viteLogo} class="logo vite" alt="Vite logo" height="32" />
  </a>
  <span>+</span>
  <a href="https://svelte.dev" target="_blank" rel="noreferrer">
    <img src={svelteLogo} class="logo svelte" alt="Svelte logo" height="36" />
  </a>
</section>

<div class="ticks"></div>

<section id="center">
  <div class="hero-image">
    <img src={heroImg} alt="Vite" class="hero-image__base" />
    <img src={svelteLogo} class="hero-image__framework" alt="Svelte logo" />
  </div>
  <div>
    <h1>Get started</h1>
    <p>Edit <code>src/App.svelte</code> and save to test <code>HMR</code></p>
  </div>
  <Counter />
</section>

<div class="ticks"></div>

<section id="next-steps">
  <div id="documentation">
    <img class="icon" src={documentationIcon} alt="Documentation" />
    <h2>Documentation</h2>
    <p>Your questions, answered</p>
    <div class="button-group">
      <a href="https://vite.dev/?ref=vite-starter-learn-more" class="button"><img src={viteLogo} alt="" />Explore Vite</a>
      <a href="https://svelte.dev/?ref=vite-starter-learn-more" class="button"><img src={svelteLogo} alt="" />Learn more</a>
    </div>
  </div>
  <div id="social">
    <img class="icon" src={socialIcon} alt="Connect with us" />
    <h2>Connect with us</h2>
    <p>Join the Vite community</p>
    <ul>
      <li><a href="https://github.com/vitejs/vite?ref=vite-starter-icon" target="_blank" rel="noreferrer"><img src={githubIcon} alt="GitHub" />GitHub</a></li>
      <li><a href="https://chat.vite.dev/?ref=vite-starter-icon" target="_blank" rel="noreferrer"><img src={discordIcon} alt="Discord" />Discord</a></li>
      <li><a href="https://x.com/vite_js?ref=vite-starter-icon" target="_blank" rel="noreferrer"><img src={xIcon} alt="X" />X.com</a></li>
      <li><a href="https://bsky.app/profile/vite.dev?ref=vite-starter-icon" target="_blank" rel="noreferrer"><img src={blueskyIcon} alt="Bluesky" />Bluesky</a></li>
    </ul>
  </div>
</section>

<div class="ticks"></div>
<section id="spacer"></section>

<style>
  #framework-logos {
    .logo {
      transition: filter 200ms ease;

      &.vite:hover {
        filter: drop-shadow(0 0 18px #bd34fe);
      }
      &.svelte:hover {
        filter: drop-shadow(0 0 18px #ff3e00);
      }
    }
  }
</style>
