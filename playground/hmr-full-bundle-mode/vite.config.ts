import { type HotUpdateOptions, type Plugin, defineConfig } from 'vite'

export interface HotUpdateContextApi {
  options?: HotUpdateOptions
  content?: string
  callOrder?: number
}

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
    delayTransformComment(),
    ...captureHotUpdateContexts(),
  ],
})

function captureHotUpdateContexts(): Plugin<HotUpdateContextApi>[] {
  const functionApi: HotUpdateContextApi = {}
  const objectApi: HotUpdateContextApi = {}
  let callIndex = 0
  return [
    {
      name: 'capture-function-hot-update-context',
      api: functionApi,
      async hotUpdate(options) {
        functionApi.callOrder = callIndex++
        functionApi.options = options
        functionApi.content = await options.read()
      },
    },
    {
      name: 'capture-object-hot-update-context',
      api: objectApi,
      hotUpdate: {
        order: 'pre',
        async handler(options) {
          objectApi.callOrder = callIndex++
          objectApi.options = options
          objectApi.content = await options.read()
        },
      },
    },
  ]
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
