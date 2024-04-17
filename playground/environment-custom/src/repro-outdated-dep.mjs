import { fileURLToPath } from 'node:url'
import { createServer, createServerModuleRunner } from 'vite'

// node playground/environment-custom/src/repro-outdated-dep.mjs
//   Error: There is a new version of the pre-bundle for "/home/hiroshi/code/others/vite/node_modules/.pnpm/@tanstack+vue-query@5.29.0/node_modules/@tanstack/vue-query/build/modern/useQueryClient.js", a page reload is going to ask for it.
//       at throwOutdatedRequest (file:///home/hiroshi/code/others/vite/packages/vite/dist/node/chunks/dep-BeTFqGKC.js:3820:17)
//       at TransformContext.transform (file:///home/hiroshi/code/others/vite/packages/vite/dist/node/chunks/dep-BeTFqGKC.js:11696:17)
//       at async Object.transform (file:///home/hiroshi/code/others/vite/packages/vite/dist/node/chunks/dep-BeTFqGKC.js:13971:30)
//       at async loadAndTransform (file:///home/hiroshi/code/others/vite/packages/vite/dist/node/chunks/dep-BeTFqGKC.js:6039:29) {
//     code: 'ERR_OUTDATED_OPTIMIZED_DEP',
//     plugin: 'vite:import-analysis',
//     id: '/home/hiroshi/code/others/vite/node_modules/.pnpm/@tanstack+vue-query@5.29.0/node_modules/@tanstack/vue-query/build/modern/useQueryClient.js',

const server = await createServer({
  clearScreen: false,
  configFile: false,
  root: fileURLToPath(new URL('..', import.meta.url)),
  environments: {
    custom: {
      webCompatible: true,
      resolve: {
        noExternal: true,
      },
      dev: {
        optimizeDeps: {
          // --- adding either one of these to fix ---
          // noDiscovery: true,
          // include: ['@tanstack/vue-query'],
        },
      },
    },
  },
})

try {
  // not ok
  const runner = createServerModuleRunner(server.environments.custom)
  await runner.import('/src/repro-outdated-dep-entry.mjs')
} finally {
  await server.close()
}
