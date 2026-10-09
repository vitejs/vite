import { defineConfig } from 'vite'

export default defineConfig({
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
