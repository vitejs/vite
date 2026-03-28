<template>
  <div class="marketing-layout">
    <div class="top-banner">
      <a href="https://viteconf.org" class="group" target="_blank" rel="noopener">
        <picture>
          <source srcset="/banner-optimized.avif" type="image/avif">
          <source srcset="/banner-optimized.webp" type="image/webp">
          <img 
            src="/banner-original.png" 
            alt="ViteConf Banner" 
            class="absolute"
            width="1200"
            height="400"
            loading="eager"
            fetchpriority="high"
            decoding="async"
          />
        </picture>
      </a>
    </div>
  </div>
</template>