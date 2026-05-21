import { build } from 'vite'

async function runBuild() {
  await build({
    build: {
      manifest: true,
      outDir: 'dist',
      rollupOptions: {
        input: {
          index: './index.ts',
        },
      },
    },
  })
}

runBuild()
