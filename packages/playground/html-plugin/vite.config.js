const htmlPlugin = require('@vitejs/plugin-html')

const htmlPluginOpt = {
  favicon: './logo.svg',
  headScripts: [
    `var msg = 'head script'
     console.log(msg);`,
    {
      async: true,
      src: 'https://abc.com/b.js',
      type: 'module'
    },
    { content: `console.log('hello')`, charset: 'utf-8' }
  ],
  scripts: [
    `var msg = 'body script'
     console.log(msg);`,
    {
      async: true,
      src: 'https://abc.com/b.js',
      type: 'module'
    }
  ],
  metas: [
    {
      name: 'keywords',
      content: 'vite html meta keywords'
    },
    {
      name: 'description',
      content: 'vite html meta description'
    },
    {
      bar: 'custom meta'
    }
  ],
  links: [
    {
      rel: 'stylesheet',
      href: './style.css'
    },
    {
      rel: 'modulepreload',
      href: 'https://cn.vitejs.dev/assets/guide_api-plugin.md.6884005a.lean.js'
    }
  ],
  style: `body { color: red; };*{ margin: 0px }`
}

module.exports = {
  plugins: [htmlPlugin(htmlPluginOpt)]
}
