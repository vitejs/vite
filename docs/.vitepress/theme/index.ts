import type { Theme } from 'vitepress'
import VoidZeroTheme from '@voidzero-dev/vitepress-theme'
import '@voidzero-dev/vitepress-theme/index.css'
import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'
import '@shikijs/vitepress-twoslash/style.css'
import SvgImage from './components/SvgImage.vue'
import YouTubeVideo from './components/YouTubeVideo.vue'
import NonInheritBadge from './components/NonInheritBadge.vue'
import 'virtual:group-icons.css'

export default {
  extends: VoidZeroTheme,
  enhanceApp({ app }) {
    app.component('SvgImage', SvgImage)
    app.component('YouTubeVideo', YouTubeVideo)
    app.component('NonInheritBadge', NonInheritBadge)
    app.use(TwoslashFloatingVue)
  },
} satisfies Theme
