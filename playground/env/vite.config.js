import { defineConfig } from 'vite'

process.env.EXPAND = 'expand'

export default defineConfig({
  base: '/env/',
  envPrefix: ['VITE_', 'CUSTOM_PREFIX_'],
  build: {
    outDir: 'dist/env',
  },
  define: {
    'import.meta.env.VITE_BOOL': true,
  },
})
