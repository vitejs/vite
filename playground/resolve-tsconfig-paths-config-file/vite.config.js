import { defineConfig } from 'vite'

// Use the explicit configFile to opt into `tsconfig.custom.json` rather
// than the default `tsconfig.json`.
export default defineConfig({
  resolve: {
    tsconfigPaths: {
      configFile: './tsconfig.custom.json',
    },
  },
})
