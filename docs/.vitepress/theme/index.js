import Theme from 'vitepress/theme'
import { h } from 'vue'
import sponsors from './sponsors.json'
import './sponsors.css'

export default {
  ...Theme,
  Layout() {
    return h(Theme.Layout, null, {
      'sidebar-bottom': () =>
        h('div', { class: 'sponsors' }, [
          h(
            'a',
            { href: 'https://github.com/sponsors/yyx990803', target: '_blank' },
            [h('span', 'Sponsors')]
          ),
          ...sponsors.map(({ href, src }) =>
            h('a', { href, target: '_blank' }, [h('img', { src })])
          )
        ])
    })
  }
}
