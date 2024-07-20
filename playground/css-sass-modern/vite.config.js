import { defineConfig } from 'vite'

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
        additionalData: `$injectedColor: orange;`,
        importers: [
          // example from https://sass-lang.com/documentation/js-api/interfaces/importer/
          {
            /**
             * @param {string} url
             */
            canonicalize(url) {
              return url.startsWith('virtual:') ? new URL(url) : null
            },
            /**
             * @param {URL} url
             */
            load(url) {
              return {
                contents: `.custom-importer { color: ${url.pathname} }`,
                syntax: 'scss',
              }
            },
          },
        ],
      },
      sass: {
        api: 'modern',
        additionalData: `$injectedColor: orange\n`,
      },
    },
  },
})
