import { h } from 'vue'
import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'
import '@shikijs/vitepress-twoslash/style.css'
import 'virtual:group-icons.css'
import 'vitepress-plugin-graphviz/style.css'
import Theme from '@voidzero-dev/vitepress-theme/src/vite'
import './styles.css'

// components
import SvgImage from './components/SvgImage.vue'
import YouTubeVideo from './components/YouTubeVideo.vue'
import NonInheritBadge from './components/NonInheritBadge.vue'
import AsideSponsors from './components/AsideSponsors.vue'
import ScrimbaLink from './components/ScrimbaLink.vue'

export default {
  Layout() {
    return h((Theme as any).Layout, null, {
      'aside-ads-before': () => h(AsideSponsors),
    })
  },
  enhanceApp(ctx: any) {
    const { app } = ctx

    app.component('SvgImage', SvgImage)
    app.component('YouTubeVideo', YouTubeVideo)
    app.component('NonInheritBadge', NonInheritBadge)
    app.component('ScrimbaLink', ScrimbaLink)
    app.use(TwoslashFloatingVue)

    const labelCopyButtons = (root: ParentNode = document) => {
      root.querySelectorAll<HTMLButtonElement>('button.copy').forEach((button) => {
        button.setAttribute('aria-label', 'Copy code')
        button.setAttribute('title', 'Copy code')
      })
    }

    if (typeof window !== 'undefined') {
      labelCopyButtons()

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof Element) {
              labelCopyButtons(node)
            }
          })
        }
      })

      observer.observe(document.body, { childList: true, subtree: true })
    }

    Theme.enhanceApp(ctx)
  },
}
