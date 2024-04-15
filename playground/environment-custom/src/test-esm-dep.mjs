import { fileURLToPath } from 'url'
import { createServer, createServerModuleRunner } from 'vite'

// node playground/environment-custom/src/test-esm-dep.mjs
// > Error: Vite Internal Error: registerMissingImport is not supported in dev custom

const server = await createServer({
  clearScreen: false,
  configFile: false,
  root: fileURLToPath(new URL('..', import.meta.url)),
  optimizeDeps: {
    force: true,
  },
  environments: {
    custom: {
      dev: {
        optimizeDeps: {
          include: ['@vite/test-esm-optimized'],
        },
      },
    },
  },
})

try {
  {
    // ok
    const runner = createServerModuleRunner(server.environments.ssr)
    await runner.import('@vite/test-esm')
  }

  {
    // ok
    const runner = createServerModuleRunner(server.environments.custom)
    await runner.import('@vite/test-esm-optimized')
  }

  {
    // not ok
    const runner = createServerModuleRunner(server.environments.custom)
    await runner.import('@vite/test-esm')
  }
} finally {
  await server.close()
}
