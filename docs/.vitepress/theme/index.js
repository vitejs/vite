import Theme from 'vitepress/theme'
import { h } from 'vue'
import SponsorsSidebar from './SponsorsSidebar.vue'
import OldDocument from './components/OldDocument.vue'
import './custom.css'

export default {
  ...Theme,
  Layout() {
    return h(Theme.Layout, null, {
      'layout-top': () => h(OldDocument),
      'sidebar-bottom': () =>
        h('div', { class: 'sponsors sidebar' }, [h(SponsorsSidebar)])
    })
  }
}
