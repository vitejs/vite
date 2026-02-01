<script setup lang="ts">
import githubIcon from '@assets/social/github-light.svg'

interface Testimonial {
  name: string
  handle: string
  avatar: string
  comment: string[]
}

const testimonials: Testimonial[] = [
  {
    name: 'Ryan Carniato',
    handle: '@RyanCarniato',
    avatar:
      'https://pbs.twimg.com/profile_images/1810837163447308292/8Piov0f6_400x400.jpg',
    comment: [
      `I'm loving what Vite enables. We've found building SolidStart that it is less a metaframework but a system of symbiotic Vite plugins. While built with SolidJS in mind, they should scale from our simplest template to opinionated starter. We're building an ecosystem on Vite.`,
    ],
  },
  {
    name: 'Rich Harris',
    handle: '@Rich_Harris',
    avatar:
      'https://pbs.twimg.com/profile_images/557940120184041473/bFyXy8Pu_400x400.jpeg',
    comment: [
      `Vite is basically the united nations of JavaScript at this point. I'll be there as a representative of Sveltelandia`,
    ],
  },
  {
    name: 'David East',
    handle: '@_davideast',
    avatar:
      'https://pbs.twimg.com/profile_images/1691627325794725888/voQFcYjY_400x400.jpg',
    comment: [
      'Each and every time I use Vite, I feel a true sense of pure and unbridled joy.',
    ],
  },
  {
    name: 'Mark Dalgleish',
    handle: '@markdalgleish',
    avatar:
      'https://pbs.twimg.com/profile_images/754886061872979968/BzaOWhs1_400x400.jpg',
    comment: [
      `It's also a great platform to build a framework on since it provides a pluggable dev environment.`,
      `Community is amazing too.`,
    ],
  },
  {
    name: 'Jason Miller',
    handle: '@_developit',
    avatar:
      'https://pbs.twimg.com/profile_images/1374778373239681025/Sc9ehtAr_400x400.jpg',
    comment: [
      `Every time I suspect I've hit the bounds of what Vite can do, I end up being wrong.`,
    ],
  },
  {
    name: 'David Cramer',
    handle: '@zeeg',
    avatar:
      'https://pbs.twimg.com/profile_images/1911613315765133312/HVkULegC_400x400.jpg',
    comment: ['Vite has been a game changer for the industry.'],
  },
  {
    name: 'Dion Almaer',
    handle: '@dalmaer',
    avatar:
      'https://pbs.twimg.com/profile_images/3380865881/f73b3687ff39b795db05fcaf35972270_400x400.jpeg',
    comment: [
      'I am so excited to see so many great frameworks teaming up on top of vite. So many will benefit. ❤️ to the vite team.',
    ],
  },
  {
    name: 'Christoph Nakazawa',
    handle: '@cpojer',
    avatar:
      'https://pbs.twimg.com/profile_images/1910252462126313472/gXgT-jxL_400x400.jpg',
    comment: ['Vite is gonna eat the (JavaScript) world.'],
  },
  {
    name: 'Nikolaj',
    handle: '@lopugit',
    avatar: 'https://avatars.githubusercontent.com/u/13629190?v=4',
    comment: [
      'Wow, wow, wow, wow, wow, wow, Vite is..... Vite is.... Wow 🤤🤯🙏',
    ],
  },
]
</script>

<template>
  <div class="wrapper wrapper--ticks border-t pt-14 sm:pt-30 px-5 sm:px-10">
    <div
      class="flex flex-col sm:flex-row justify-between items-center gap-8 sm:gap-20 text-center sm:text-left"
    >
      <div class="flex flex-col gap-3">
        <h3 class="text-white max-w-xl text-balance">Loved by the community</h3>
        <p class="max-w-md text-white/70 text-balance">
          Don't take our word for it - listen to what Vite community members
          have to say.
        </p>
      </div>
      <div
        class="flex gap-8 sm:gap-12 items-start justify-center sm:justify-start sm:pr-20"
      >
        <!-- GitHub Stars -->
        <div class="flex flex-col gap-3">
          <h2 class="text-white">75k+</h2>
          <p class="text-grey flex items-center gap-2">
            <img :src="githubIcon" alt="" class="size-6" />
            Github Stars
          </p>
        </div>

        <!-- NPM Downloads -->
        <div class="flex flex-col gap-3">
          <h2 class="text-white">40m+</h2>
          <p class="text-grey">Weekly NPM downloads</p>
        </div>
      </div>
    </div>
    <div
      class="pt-14 sm:pt-30 h-[50rem] overflow-clip [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]"
    >
      <!-- Masonry Grid -->
      <div class="columns-1 sm:columns-2 lg:columns-3 gap-5">
        <div
          v-for="(testimonial, index) in testimonials"
          :key="index"
          class="break-inside-avoid mb-5"
        >
          <div
            class="testimonial-card relative overflow-clip isolate rounded-lg p-6 sm:px-8 sm:py-10 flex flex-col gap-6 before:content-[''] before:absolute before:inset-0 before:opacity-0 before:z-0 before:pointer-events-none before:transition-opacity before:duration-100 before:ease-in-out after:content-[''] after:absolute after:inset-px after:z-[1] after:rounded-lg after:bg-slate after:border after:border-nickel after:transition-[border-color,background] after:duration-100 after:ease-in-out hover:before:opacity-100 hover:after:border-transparent"
          >
            <!-- Comment -->
            <div class="relative z-[2] flex flex-col gap-4">
              <p
                v-for="(paragraph, pIndex) in testimonial.comment"
                :key="pIndex"
                class="text-white/70 leading-relaxed text-sm sm:text-base"
              >
                {{ paragraph }}
              </p>
            </div>

            <!-- Author -->
            <div class="relative z-[2] flex items-center gap-5 mt-auto">
              <!-- Avatar -->
              <img
                :src="testimonial.avatar"
                :alt="testimonial.name"
                class="w-12 h-12 rounded-sm object-cover flex-shrink-0"
                loading="lazy"
              />

              <!-- Author info -->
              <div class="flex flex-col">
                <span class="text-grey text-sm font-mono">{{
                  testimonial.name
                }}</span>
                <span class="text-biege text-sm font-mono">{{
                  testimonial.handle
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Background image and animation for ::before pseudo-element */
.testimonial-card::before {
  background-image: url('@assets/vite/vite-featurepanel-4-background.jpg');
  background-size: 150% 150%;
  background-position: center;
  animation: move-background 16s ease-in-out infinite;
}

/* Randomize animation timing for organic feel */
.testimonial-card:nth-child(2)::before {
  animation-duration: 18s;
  animation-delay: -3s;
}

.testimonial-card:nth-child(3)::before {
  animation-duration: 14s;
  animation-delay: -7s;
}

.testimonial-card:nth-child(4)::before {
  animation-duration: 20s;
  animation-delay: -5s;
}

.testimonial-card:nth-child(5)::before {
  animation-duration: 15s;
  animation-delay: -9s;
}

.testimonial-card:nth-child(6)::before {
  animation-duration: 19s;
  animation-delay: -2s;
}

.testimonial-card:nth-child(7)::before {
  animation-duration: 17s;
  animation-delay: -11s;
}

.testimonial-card:nth-child(8)::before {
  animation-duration: 16s;
  animation-delay: -6s;
}
</style>
