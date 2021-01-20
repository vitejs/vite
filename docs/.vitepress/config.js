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

    locales: {
      '/': {
        lang: 'en-US',
        label: 'English',
        selectText: 'Languages',
        nav: [
          { text: 'Guide & APIs', link: '/guide/' },
          { text: 'Config Reference', link: '/config/' }
        ]
      },
      '/zh/': {
        lang: 'zh-CN',
        label: '中文',
        selectText: '选择语言',
        editLinkText: '为此页提供修改建议',
        nav: [
          { text: '指引 & API', link: '/zh/guide/' },
          { text: '配置参考', link: '/zh/config/' }
        ]
      }
    },

    sidebar: {
      '/config/': 'auto',
      '/zh/config/': 'auto',
      '/zh/': [
        {
          text: '指引',
          children: [
            {
              text: '介绍',
              link: '/zh/guide/introduction'
            },
            {
              text: '开始',
              link: '/zh/guide/'
            },
            {
              text: '功能',
              link: '/zh/guide/features'
            },
            {
              text: '依赖预构建',
              link: '/zh/guide/dep-pre-bundling'
            },
            {
              text: '构建生产版本',
              link: '/zh/guide/build'
            },
            {
              text: '环境变量与模式',
              link: '/zh/guide/env-and-mode'
            },
            {
              text: '后端集成',
              link: '/zh/guide/backend-integration'
            },
            {
              text: '比较',
              link: '/zh/guide/comparisons'
            },
            {
              text: '从 v1 迁移',
              link: '/zh/guide/migration'
            }
          ]
        },
        {
          text: 'API',
          children: [
            {
              text: '配置参考',
              link: '/zh/config/'
            },
            {
              text: '插件 API',
              link: '/zh/guide/api-plugin'
            },
            {
              text: 'HMR API',
              link: '/zh/guide/api-hmr'
            },
            {
              text: 'JavaScript API',
              link: '/zh/guide/api-javascript'
            }
          ]
        }
      ],
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
              text: 'Config Reference',
              link: '/config/'
            },
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
  },
  locales: {
    '/': {
      lang: 'en-US'
    },
    '/zh': {
      lang: 'zh-CN',
      description: '下一代前端开发与构建工具'
    }
  }
}
