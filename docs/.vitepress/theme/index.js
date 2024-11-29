import Theme from 'vitepress/theme'
import { h } from 'vue'
import SponsorsSidebar from './SponsorsSidebar.vue'
import WrappedLayout from './components/WrappedLayout.vue'
import './custom.css'

export default {
  ...Theme,
  Layout() {
    return h(WrappedLayout, null, {
      'sidebar-bottom': () =>
        h('div', { class: 'sponsors sidebar' }, [h(SponsorsSidebar)])
    })
  }
}
