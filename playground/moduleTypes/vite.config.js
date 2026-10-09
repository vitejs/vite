import { defineConfig } from 'vite'

export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'classic',
      pragma: 'window.h',
      pragmaFrag: 'Fragment',
    },
  },
  build: {
    rolldownOptions: {
      moduleTypes: {
        '.label': 'text',
        '.jsonlabel': 'json',
        '.jsxlabel': 'jsx',
      },
    },
  },
})
