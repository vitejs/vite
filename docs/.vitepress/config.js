// @ts-check

/**
 * @type {import('vitepress').UserConfig}
 */
module.exports = {
  title: 'Vite⚡',
  description: 'Next Generation Frontend Tooling',
  head: [
    [
      'style',
      {},
      'img { border-radius: 10px }' + 'h1.title { margin-left: 0.5em }'
    ]
  ],
  themeConfig: {
    repo: 'vitejs/vite',
    docsDir: 'docs',
    docsBranch: 'main',
    editLinks: true,
    editLinkText: 'Suggest changes to this page',

    nav: [
      { text: 'Guide & APIs', link: '/guide/' },
      { text: 'Config Reference', link: '/config/' }
    ],

    sidebar: {
      '/config/': 'auto',
      // catch-all fallback
      '/': [
        {
          text: 'Guide',
          children: [
            {
              text: 'Introduction',
              link: '/guide/introduction'
            },
            {
              text: 'Getting Started',
              link: '/guide/'
            },
            {
              text: 'Features',
              link: '/guide/features'
            },
            {
              text: 'Dependency Pre-Bundling',
              link: '/guide/dep-pre-bundling'
            },
            {
              text: 'Building for Production',
              link: '/guide/build'
            },
            {
              text: 'Env Variables and Modes',
              link: '/guide/env-and-mode'
            },
            {
              text: 'Backend Integration',
              link: '/guide/backend-integration'
            },
            {
              text: 'Comparisons',
              link: '/guide/comparisons'
            },
            {
              text: 'Migration from v1',
              link: '/guide/migration'
            }
          ]
        },
        {
          text: 'APIs',
          children: [
            {
              text: 'Plugin API',
              link: '/guide/api-plugin'
            },
            {
              text: 'HMR API',
              link: '/guide/api-hmr'
            },
            {
              text: 'JavaScript API',
              link: '/guide/api-javascript'
            }
          ]
        }
      ]
    }
  }
}
