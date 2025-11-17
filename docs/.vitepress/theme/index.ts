import { h } from 'vue'
import type { NavItemWithLink, Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
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

  transformNavLink(link: NavItemWithLink) {
    try {
      const url =
        typeof link.link === 'string' ? link.link : (link.link as any)?.url
      if (!url || typeof url !== 'string') return link

      const host = new URL(url).hostname
      if (host === 'vite.dev' || host.endsWith('.vite.dev')) {
        return {
          ...link,
          // set target to _self — VitePress will use this when rendering the <a>
          target: '_self',
        }
      }
    } catch {
      // ignore parse errors and return original link
    }
    return link
  },

  Layout() {
    // keep the existing layout slots
    return h(DefaultTheme.Layout, null, {
      'layout-top': () => h(SponsorBanner),
      'aside-ads-before': () => h(AsideSponsors),
    })
  },

  enhanceApp({ app }) {
    // register components / plugins exactly as before
    app.component('SvgImage', SvgImage)
    app.component('YouTubeVideo', YouTubeVideo)
    app.component('NonInheritBadge', NonInheritBadge)
    app.use(TwoslashFloatingVue)
  },
} satisfies Theme
