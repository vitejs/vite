import { h } from 'vue'
import Theme from 'vitepress/theme'
import SponsorsSidebar from './SponsorsSidebar.vue'
import './styles/vars.css'
import './styles/custom.css'

export default {
  ...Theme,
  Layout() {
    return h(Theme.Layout, null, {
      'sidebar-bottom': () =>
        h('div', { class: 'sponsors sidebar' }, [h(SponsorsSidebar)])
    })
  }
}
