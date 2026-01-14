import { type Plugin, defineConfig } from 'vite'

export default defineConfig({
  experimental: {
    bundledDev: true,
  },
  plugins: [waitBundleCompleteUntilAccess(), delayTransformComment()],
  build: {
    rolldownOptions: {
      experimental: {
        devMode: {
          lazy: true,
        },
      },
    },
  },
})

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
