import { h } from 'vue'
import type { Theme } from 'vitepress'
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
    // Fix locale links opening in new tab
    if (typeof window !== 'undefined') {
      const fixLocaleLinks = () => {
        const siteDomain = 'vite.dev'
        const links = document.querySelectorAll('a[target="_blank"]')

        links.forEach((a) => {
          if (!a.href) return

          let url
          try {
            url = new URL(a.href)
          } catch {
            return
          }

          // remove target for subdomains of vite.dev
          if (
            url.hostname === siteDomain ||
            url.hostname.endsWith(`.${siteDomain}`)
          ) {
            a.removeAttribute('target')
          }
        })
      }

      window.addEventListener('DOMContentLoaded', fixLocaleLinks)
      const observer = new MutationObserver(fixLocaleLinks)
      observer.observe(document.body, { childList: true, subtree: true })
    }
  },
} satisfies Theme
