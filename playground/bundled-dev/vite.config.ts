import { type Plugin, defineConfig } from 'vite'

export default defineConfig({
  experimental: {
    bundledDev: true,
  },
  plugins: [waitBundleCompleteUntilAccess()],
})

function waitBundleCompleteUntilAccess(): Plugin {
  let resolvers: PromiseWithResolvers<void>

  return {
    name: 'wait-bundle-complete-until-access',
    apply: 'serve',
    configureServer(server) {
      let accessCount = 0
      resolvers = promiseWithResolvers()

      server.middlewares.use((req, _res, next) => {
        if (req.url === '/' || req.url === '/index.html') {
          accessCount++
          if (accessCount === 1) {
            resolvers.resolve()
          }
        }
        next()
      })
    },
    async generateBundle() {
      await resolvers.promise
    },
  }
}

interface PromiseWithResolvers<T> {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: any) => void
}

function promiseWithResolvers<T>(): PromiseWithResolvers<T> {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })
  return { promise, resolve, reject }
}
