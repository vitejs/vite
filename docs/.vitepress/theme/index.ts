import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'

import type { Theme } from 'vitepress'
import type { DefaultTheme as VPDefaultTheme } from 'vitepress/theme'

import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'
import '@shikijs/vitepress-twoslash/style.css'

import './styles/vars.css'
import './styles/landing.css'

import AsideSponsors from './components/AsideSponsors.vue'
import SvgImage from './components/SvgImage.vue'
import YouTubeVideo from './components/YouTubeVideo.vue'
import SponsorBanner from './components/SponsorBanner.vue'
import NonInheritBadge from './components/NonInheritBadge.vue'
import 'virtual:group-icons.css'

export default {
  extends: DefaultTheme,

  themeConfig: {
    transformNavLink(link: VPDefaultTheme.NavItemWithLink) {
      try {
        const url =
          typeof link.link === 'string' ? link.link : (link.link as any)?.url

        if (!url) return link

        const host = new URL(url).hostname

        if (host === 'vite.dev' || host.endsWith('.vite.dev')) {
          return { ...link, target: '_self' }
        }
      } catch {
        // Ignore invalid URLs
      }
      return link
    },
  },

  Layout() {
    return h(DefaultTheme.Layout, null, {
      'layout-top': () => h(SponsorBanner),
      'aside-ads-before': () => h(AsideSponsors),
    })
  },

  enhanceApp({ app }) {
    app.component('SvgImage', SvgImage)
    app.component('YouTubeVideo', YouTubeVideo)
    app.component('NonInheritBadge', NonInheritBadge)
    app.use(TwoslashFloatingVue)
  },
} satisfies Theme
