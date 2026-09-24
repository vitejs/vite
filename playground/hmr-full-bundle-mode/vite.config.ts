import { type Plugin, defineConfig } from 'vite'

export default defineConfig({
  experimental: {
    bundledDev: true,
  },
  build: {
    // emit assets as files instead of inlining, for the new-asset HMR test
    assetsInlineLimit: 0,
  },
  plugins: [
    waitBundleCompleteUntilAccess(),
    waitForLatestBuildOutput(),
    delayTransformComment(),
  ],
})

function waitForLatestBuildOutput(): Plugin {
  let changeVersion = 0
  const changeWaiters = new Set<() => void>()

  function notifyChange() {
    changeVersion++
    for (const resolve of changeWaiters) resolve()
    changeWaiters.clear()
  }

  return {
    name: 'wait-for-latest-build-output',
    apply: 'serve',
    watchChange(id) {
      if (id.endsWith('/hmr.js')) notifyChange()
    },
    configureServer(server) {
      server.middlewares.use('/__test-change-version', (_req, res) => {
        res.end(String(changeVersion))
      })
      server.middlewares.use('/__test-after-build', async (req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const previousVersion = Number(url.searchParams.get('after'))
        if (changeVersion <= previousVersion) {
          await new Promise<void>((resolve) => changeWaiters.add(resolve))
        }
        await server.environments.client.bundledDev!.waitForLatestBuildOutput()
        server.environments.client.hot.send('test:after-build')
        res.end()
      })
    },
  }
}

function waitBundleCompleteUntilAccess(): Plugin {
  let resolvers: PromiseWithResolvers<void>

  return {
    name: 'wait-bundle-complete-until-access',
    apply: 'serve',
    configureServer(server) {
      let accessCount = 0
      resolvers = promiseWithResolvers()

      server.middlewares.use((_req, _res, next) => {
        accessCount++
        if (accessCount === 1) {
          resolvers.resolve()
        }
        next()
      })
    },
    async generateBundle() {
      await resolvers.promise
      await new Promise<void>((resolve) => setTimeout(resolve, 300))
    },
  }
}

function delayTransformComment(): Plugin {
  return {
    name: 'delay-transform-comment',
    async transform(code) {
      if (code.includes('// @delay-transform')) {
        await new Promise<void>((resolve) => setTimeout(resolve, 300))
      }
    },
  }
}

interface PromiseWithResolvers<T> {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: any) => void
}
function promiseWithResolvers<T>(): PromiseWithResolvers<T> {
  let resolve: any
  let reject: any
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })
  return { promise, resolve, reject }
}
