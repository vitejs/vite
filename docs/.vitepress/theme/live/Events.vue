<script setup lang="ts">
import background from '@voidzero-dev/vitepress-theme/src/assets/vite/footer-background.jpg'
import event1 from '../../../images/events/viteconf_2022.jpg'
import event2 from '../../../images/events/viteconf_2023.jpg'
import event3 from '../../../images/events/viteconf_2024.jpg'
import event4 from '../../../images/events/viteconf_2025.jpg'

const EVENTS = [
  {
    date: '2025',
    title: 'ViteConf 2025',
    image: event4,
    url: 'https://www.youtube.com/watch?v=x7Jsmt_o9ek&list=PLqGQbXn_GDmkJaoykvHCUmXUPjhgH2bVr',
  },
  {
    date: '2024',
    title: 'ViteConf 2024',
    image: event3,
    url: 'https://www.youtube.com/watch?v=mWK3Y_1kmaM&list=PLqGQbXn_GDmnObDzgjUF4Krsfl6OUKxtp',
  },
  {
    date: '2023',
    title: 'ViteConf 2023',
    image: event2,
    url: 'https://www.youtube.com/watch?v=veCxKeLl35A&list=PLqGQbXn_GDmkOsHI7-Wrbv1GgAA4tJZhg',
  },
  {
    date: '2022',
    title: 'ViteConf 2022',
    image: event1,
    url: 'https://www.youtube.com/watch?v=Znd11rVHQOE&list=PLqGQbXn_GDmkI_lwbq5LsVYMEoX2ilKfI',
  },
]
</script>

<template>
  <div class="wrapper wrapper--ticks w-full text-center md:text-left">
    <h2
      class="text-white text-2xl px-10 py-5 text-pretty border-nickel border-y"
    >
      Previous events
    </h2>
    <div class="relative grid md:grid-cols-2 xl:grid-cols-4 wrapper--ticks">
      <a
        v-for="event in EVENTS"
        :key="event.date"
        class="group event-card block p-0.5"
        :style="`background-image: url(${background});`"
        :href="event.url"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          :src="event.image"
          :alt="event.title"
          class="w-full aspect-video object-cover"
        />
        <div class="bg-primary group-hover:bg-primary/95 bg-blur-lg">
          <h3 class="text-white text-xl px-10 py-3 text-pretty">
            {{ event.title }}
          </h3>
        </div>
      </a>
    </div>
  </div>
</template>

<style>
.event-card {
  background-size: 200% 200%;
  background-position: 100% 200%;
  background-blend-mode: overlay;
  background-color: rgba(0, 0, 0, 0.5);
}
.event-card:hover {
  animation: event-card-hover 10s ease-in-out infinite;
  background-color: transparent;
}
@keyframes event-card-hover {
  0% {
    background-position: 100% 200%;
  }
  50% {
    background-position: -100% 200%;
  }
  100% {
    background-position: 100% 200%;
  }
}
</style>
