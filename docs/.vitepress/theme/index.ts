import { h } from 'vue'
import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'
import '@shikijs/vitepress-twoslash/style.css'
import 'virtual:group-icons.css'
import VoidZeroTheme, { themeContextKey } from '@voidzero-dev/vitepress-theme'
import '@voidzero-dev/vitepress-theme/src/vitepress/styles/index.css'

// inject project variant assets
import logoDark from '@assets/logos/vite-dark.svg'
import logoLight from '@assets/logos/vite-light.svg'
import footerBg from '@assets/vite/footer-background.jpg'
import monoIcon from '@assets/icons/vite-mono.svg'

// components
import SvgImage from './components/SvgImage.vue'
import YouTubeVideo from './components/YouTubeVideo.vue'
import NonInheritBadge from './components/NonInheritBadge.vue'
import AsideSponsors from './components/AsideSponsors.vue'

export default {
  Layout() {
    return h(VoidZeroTheme.Layout, null, {
      'aside-ads-before': () => h(AsideSponsors),
    })
  },
  enhanceApp(ctx: any) {
    const { app } = ctx

    app.provide(themeContextKey, {
      logoDark,
      logoLight,
      logoAlt: 'Vite',
      footerBg,
      monoIcon,
    })

    app.component('SvgImage', SvgImage)
    app.component('YouTubeVideo', YouTubeVideo)
    app.component('NonInheritBadge', NonInheritBadge)
    app.use(TwoslashFloatingVue)
    VoidZeroTheme.enhanceApp(ctx)
  },
}
