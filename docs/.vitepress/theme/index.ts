import { h } from 'vue'
import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'
import '@shikijs/vitepress-twoslash/style.css'
import SvgImage from './components/SvgImage.vue'
import YouTubeVideo from './components/YouTubeVideo.vue'
import NonInheritBadge from './components/NonInheritBadge.vue'
import 'virtual:group-icons.css'
import AsideSponsors from './components/AsideSponsors.vue'
import VoidZeroTheme from '@voidzero-dev/vitepress-theme'
import '@voidzero-dev/vitepress-theme/src/vitepress/styles/index.css'

export default {
  Layout() {
    return h(VoidZeroTheme.Layout, null, {
      'aside-ads-before': () => h(AsideSponsors),
    })
  },
  enhanceApp(ctx: any) {
    const { app } = ctx
    app.component('SvgImage', SvgImage)
    app.component('YouTubeVideo', YouTubeVideo)
    app.component('NonInheritBadge', NonInheritBadge)
    app.use(TwoslashFloatingVue)
    VoidZeroTheme.enhanceApp(ctx)
  },
}
