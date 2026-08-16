<script lang="ts" setup>
import { computed } from 'vue'
import VPFlyout from '@vp-default/VPFlyout.vue'
import VPMenuLink from './VPMenuLink.vue'
import VPSwitchAppearance from '@vp-default/VPSwitchAppearance.vue'
import VPSocialLinks from '@vp-default/VPSocialLinks.vue'
import { useData } from '@vp-composables/data'
import { useLangs } from '@vp-composables/langs'

const { site, theme, frontmatter } = useData()
const { localeLinks, currentLang } = useLangs({ correspondingLink: true })

const isForcedTheme = computed(() => !!frontmatter.value.theme)

const hasExtraContent = computed(
  () =>
    (localeLinks.value.length && currentLang.value.label) ||
    (site.value.appearance && !isForcedTheme.value) ||
    theme.value.socialLinks,
)
</script>

<template>
  <VPFlyout
    v-if="hasExtraContent"
    class="VPNavBarExtra"
    label="extra navigation"
  >
    <div
      v-if="localeLinks.length && currentLang.label"
      class="group translations"
    >
      <p class="trans-title">{{ currentLang.label }}</p>

      <template v-for="locale in localeLinks" :key="locale.link">
        <VPMenuLink
          :item="locale"
          :external="false"
          :lang="locale.lang"
          :hreflang="locale.lang"
          rel="alternate"
          :dir="locale.dir"
        />
      </template>
    </div>

    <div
      v-if="
        site.appearance &&
        site.appearance !== 'force-dark' &&
        site.appearance !== 'force-auto' &&
        !isForcedTheme
      "
      class="group"
    >
      <div class="item appearance">
        <p class="label">
          {{ theme.darkModeSwitchLabel || 'Appearance' }}
        </p>
        <div class="appearance-action">
          <VPSwitchAppearance />
        </div>
      </div>
    </div>

    <div v-if="theme.socialLinks" class="group">
      <div class="item social-links">
        <VPSocialLinks class="social-links-list" :links="theme.socialLinks" />
      </div>
    </div>
  </VPFlyout>
</template>

<style scoped>
.VPNavBarExtra {
  display: none;
  margin-right: -12px;
}

@media (min-width: 768px) {
  .VPNavBarExtra {
    display: block;
  }
}

@media (min-width: 1280px) {
  .VPNavBarExtra {
    display: none;
  }
}

.trans-title {
  padding: 0 24px 0 12px;
  line-height: 32px;
  font-size: 14px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.item.appearance,
.item.social-links {
  display: flex;
  align-items: center;
  padding: 0 12px;
}

.item.appearance {
  min-width: 176px;
}

.appearance-action {
  margin-right: -2px;
}

.social-links-list {
  margin: -4px -8px;
}
</style>
