import { h } from 'vue'
import type { Theme } from 'vitepress'
import VoidZeroTheme from '@voidzero-dev/vitepress-theme'
import '@voidzero-dev/vitepress-theme/index.css'
import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'
import '@shikijs/vitepress-twoslash/style.css'
import SvgImage from './components/SvgImage.vue'
import YouTubeVideo from './components/YouTubeVideo.vue'
import NonInheritBadge from './components/NonInheritBadge.vue'
import 'virtual:group-icons.css'
import AsideSponsors from './components/AsideSponsors.vue'

export default {
  extends: VoidZeroTheme,
  Layout() {
    return h(VoidZeroTheme.Layout, null, {
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
