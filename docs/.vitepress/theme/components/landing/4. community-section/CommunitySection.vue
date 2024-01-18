<script setup>
import CommunityCard from './CommunityCard.vue'

const testimonials = [
  {
    name: 'Evan You',
    handle: '@youyuxi',
    avatar:
      'https://pbs.twimg.com/profile_images/1630207820359700480/a3pHtm6T_400x400.jpg',
    comment:
      'Vite is a next-gen build tool that significantly improves the frontend development experience.',
  },
  {
    name: 'Simon Le Marchant',
    handle: '@marchantweb',
    avatar:
      'https://pbs.twimg.com/profile_images/1737249339209084928/3272YRNF_400x400.jpg',
    comment:
      'When I started in frontend, build tooling was a pain to setup. Vite was the first tool that made it fast and easy.',
  },
  {
    name: 'Persona',
    handle: '@XXX',
    avatar: 'https://i.pravatar.cc/150?u=1',
    comment:
      'Vite revolutionized my development workflow with its lightning-fast 🚀 HMR and seamless integration.',
  },
  {
    name: 'Persona',
    handle: '@XXX',
    avatar: 'https://i.pravatar.cc/150?u=2',
    comment:
      'The simplicity and speed of Vite have significantly boosted my productivity in web projects.',
  },
  {
    name: 'Persona',
    handle: '@XXX',
    avatar: 'https://i.pravatar.cc/150?u=3',
    comment:
      'Switching to Vite was a game-changer - faster builds, less configuration, more coding. 🙌',
  },
  {
    name: 'Persona',
    handle: '@XXX',
    avatar: 'https://i.pravatar.cc/150?u=4',
    comment: 'No more endless config files and setup hassles.',
  },
  {
    name: 'Persona',
    handle: '@XXX',
    avatar: 'https://i.pravatar.cc/150?u=5',
    comment:
      "The ease of setting up a project with Vite is unparalleled. It's a joy to work with.",
  },
  {
    name: 'Persona',
    handle: '@XXX',
    avatar: 'https://i.pravatar.cc/150?u=6',
    comment:
      "I love 😍 how Vite is framework agnostic, making it a versatile tool for any project. 🚀 I've switched everything to Vite, including Vue, React and Svelte projects. ",
  },
  {
    name: 'Persona',
    handle: '@XXX',
    avatar: 'https://i.pravatar.cc/150?u=7',
    comment:
      "Vite's live reloading (HMR) is incredibly fast, making UI development a breeze.",
  },
  {
    name: 'Persona',
    handle: '@XXX',
    avatar: 'https://i.pravatar.cc/150?u=8',
    comment:
      "The documentation and community support for Vite have made my journey smooth and enjoyable. I used to dread web development, but now I can't get enough of it, thanks to Vite! 🙌 Building websites has never been this enjoyable.",
  },
  {
    name: 'Persona',
    handle: '@XXX',
    avatar: 'https://i.pravatar.cc/150?u=9',
    comment:
      "Vite's asset handling and module resolution are incredibly efficient and developer-friendly.",
  },
  {
    name: 'Persona',
    handle: '@XXX',
    avatar: 'https://i.pravatar.cc/150?u=10',
    comment:
      "Adopting Vite has been a major efficiency boost for our team's front-end projects.",
  },
]
</script>

<template>
  <section class="community-section">
    <h2>Join the community</h2>
    <h3>
      Supported by a network of early advocates, contributors, and champions.
    </h3>
    <div class="community-grid-container">
      <div class="community-grid">
        <CommunityCard
          :testimonial="testimonial"
          v-for="testimonial in testimonials"
          :key="testimonial.name"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.community-section {
  margin-top: 140px;
  display: none;

  @media (min-width: 768px) {
    display: block;
  }

  h2 {
    background: linear-gradient(0deg, #fff 0%, rgba(255, 255, 255, 0.76) 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 auto 10px;
    text-align: center;
  }

  h3 {
    width: 455px;
    max-width: 100%;
    margin: 0 auto;
    text-align: center;
  }

  .community-grid-container {
    overflow: hidden;
    max-height: 700px;
    position: relative;

    &:after {
      content: '';
      display: block;
      width: 100%;
      height: 150px;
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

  .community-grid {
    column-count: 2;
    column-gap: 25px;
    width: calc(100% - 50px);
    margin: 40px auto 0;

    @media (min-width: 1150px) {
      column-count: 3;
      width: 1100px;
    }
  }
}
</style>
