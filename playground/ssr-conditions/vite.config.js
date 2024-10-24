import { defineConfig } from 'vite'

export default defineConfig({
  ssr: {
    external: ['@vitejs/test-ssr-conditions-external'],
    noExternal: ['@vitejs/test-ssr-conditions-no-external'],
    resolve: {
      conditions: [
        'module',
        'node',
        'production',
        'development',
        'react-server',
      ],
      externalConditions: ['node', 'workerd', 'react-server'],
    },
  },
})
