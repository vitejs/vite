import type { Theme } from 'vitepress'
import BaseTheme, { OSSProjectLayout } from '@voidzero-dev/vitepress-theme'
import '@voidzero-dev/vitepress-theme/index.css'
import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'
import '@shikijs/vitepress-twoslash/style.css'
// import AsideSponsors from './components/AsideSponsors.vue'
import SvgImage from './components/SvgImage.vue'
import YouTubeVideo from './components/YouTubeVideo.vue'
// import SponsorBanner from './components/SponsorBanner.vue'
import NonInheritBadge from './components/NonInheritBadge.vue'
import 'virtual:group-icons.css'

export default {
  extends: BaseTheme as unknown as Theme,
  Layout: OSSProjectLayout,
  enhanceApp({ app }) {
    app.component('SvgImage', SvgImage)
    app.component('YouTubeVideo', YouTubeVideo)
    app.component('NonInheritBadge', NonInheritBadge)
    app.use(TwoslashFloatingVue)
  },
} satisfies Theme
