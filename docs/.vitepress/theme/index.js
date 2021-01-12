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
            {
              href: 'https://github.com/sponsors/yyx990803',
              target: '_blank',
              rel: 'noopener'
            },
            [h('span', 'Sponsors')]
          ),
          ...sponsors.map(({ href, src, name }) =>
            h(
              'a',
              {
                href,
                target: '_blank',
                rel: 'noopener',
                'aria-label': 'sponsor-img'
              },
              [h('img', { src, alt: name })]
            )
          )
        ])
    })
  }
}
