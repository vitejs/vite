<script setup lang="ts">
import { computed, inject } from 'vue'
import { useData } from 'vitepress'
import { Icon } from '@iconify/vue'
import {
  themeContextKey,
  type BannerConfig,
} from '@voidzero-dev/vitepress-theme'

const { theme, frontmatter } = useData()

const isMarketingPage = computed(() => {
  const layout = frontmatter.value.layout
  return layout === 'home' || (layout && layout !== 'doc' && layout !== 'page')
})

const bannerConfig = computed<BannerConfig | undefined>(
  () => theme.value.banner,
)
const showBanner = computed(
  () => bannerConfig.value?.text && bannerConfig.value?.url,
)
const bannerText = computed(() => bannerConfig.value?.text || '')
const bannerUrl = computed(() => bannerConfig.value?.url || '#')
const { footerBg, monoIcon, logoAlt } = inject(themeContextKey)!

const linkTarget = computed(() => {
  if (bannerConfig.value?.target) {
    return bannerConfig.value.target
  }

  const url = bannerConfig.value?.url || ''
  return url.startsWith('http') ? '_blank' : '_self'
})

const linkRel = computed(() => {
  return linkTarget.value === '_blank' ? 'noopener noreferrer' : undefined
})

function dismiss() {
  document.documentElement.classList.add('banner-dismissed')
  localStorage.setItem(
    `banner-dismissed-${bannerConfig.value?.id || ''}`,
    'true',
  )
}
</script>

<template>
  <div
    v-if="showBanner"
    :class="
      isMarketingPage
        ? 'top-banner hidden md:block relative w-full overflow-hidden'
        : 'top-banner hidden md:block relative w-full overflow-hidden lg:fixed lg:top-0 lg:left-0 lg:right-0 lg:z-60'
    "
    data-theme="dark"
  >
    <a
      :href="bannerUrl"
      :target="linkTarget"
      :rel="linkRel"
      class="group block relative w-full no-underline text-white"
    >
      <img
        :src="footerBg"
        alt=""
        aria-hidden="true"
        class="banner-background absolute inset-0 size-full object-cover"
        loading="eager"
      />
      <div class="banner-gradient absolute inset-0" aria-hidden="true" />
      <div class="banner-shine absolute inset-0" aria-hidden="true" />

      <div class="relative z-10 w-full h-10 flex px-4">
        <div class="flex items-center gap-2 w-full max-w-360 mx-auto px-4">
          <img
            :src="monoIcon"
            :alt="`${logoAlt} icon`"
            class="size-5 shrink-0 hidden sm:block drop-shadow-md/70"
          />

          <span
            class="text-xs translate-y-px font-medium font-mono leading-snug tracking-wide uppercase whitespace-nowrap overflow-hidden text-ellipsis text-shadow-md/50"
          >
            {{ bannerText }}
          </span>

          <svg
            class="shrink-0 transition-transform duration-200 group-hover:translate-x-1"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect width="20" height="20" rx="4" fill="#08060D" />
            <rect
              x="0.5"
              y="0.5"
              width="19"
              height="19"
              rx="3.5"
              stroke="white"
              stroke-opacity="0.15"
            />
            <path
              d="M10 6L14 10L10 14"
              stroke="white"
              stroke-width="1.2"
              stroke-linejoin="round"
            />
            <path
              d="M14 10L6 10"
              stroke="white"
              stroke-width="1.2"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>
    </a>

    <button
      @click="dismiss"
      aria-label="Close banner"
      class="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 text-white hover:opacity-70 transition-opacity"
      type="button"
    >
      <Icon icon="lucide:x" class="size-5 cursor-pointer" aria-hidden="true" />
    </button>
  </div>
</template>

<style>
:root.banner-dismissed .top-banner {
  display: none;
}

.banner-gradient {
  background:
    linear-gradient(
      90deg,
      rgba(140, 0, 255, 0.54) 0%,
      rgba(140, 0, 255, 0.54) 38%,
      rgba(186, 24, 154, 0.58) 48%,
      rgba(244, 86, 58, 0.86) 60%,
      rgba(250, 116, 68, 0.98) 64%,
      rgba(250, 116, 68, 0.98) 100%
    ),
    radial-gradient(circle at 9% 50%, rgba(162, 0, 255, 0.7), transparent 24%),
    radial-gradient(circle at 74% 50%, rgba(250, 116, 68, 0.9), transparent 36%);
  mix-blend-mode: color;
}

.banner-shine {
  background:
    linear-gradient(
      90deg,
      rgba(8, 6, 13, 0.68),
      rgba(8, 6, 13, 0.18) 44%,
      rgba(8, 6, 13, 0.24)
    ),
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.18),
      rgba(255, 255, 255, 0.02)
    );
}

.banner-background {
  filter: saturate(1.22) contrast(1.08);
  object-position: center 52%;
}

@media (min-width: 768px) {
  .top-banner {
    --vp-banner-height: 40px;
  }

  :root:has(.top-banner):not(.banner-dismissed) {
    --vp-banner-height: 40px;
  }
}
</style>
