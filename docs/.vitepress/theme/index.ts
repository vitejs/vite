import { h } from 'vue'
import Theme from 'vitepress/theme'
import './styles/vars.css'
import './styles/custom.css'
import HomeSponsors from './HomeSponsors.vue'
import SponsorsSidebar from './SponsorsSidebar.vue'

export default {
  ...Theme,
  Layout() {
    return h(Theme.Layout, null, {
      'home-features-after': () => h(HomeSponsors),

      'sidebar-bottom': () =>
        h('div', { class: 'sponsors sidebar' }, [h(SponsorsSidebar)])
    })
  }
}
