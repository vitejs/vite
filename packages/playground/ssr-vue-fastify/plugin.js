const { resolve, vite, middie, static, fp } = require('./deps')
const { getHandler, getTemplateGetter, assign } = require('./handler')

async function fastifyVite (fastify, options) {
  // Set option defaults
  if (!options.ssrDataKey) {
    options.ssrDataKey = '$ssrData'
  }
  if (!options.rootDir) {
    options.rootDir = __dirname
  }
  if (!options.srcDir) {
    options.srcDir = options.rootDir
  }
  if (!options.dev) {
    options.distDir = resolve(options.rootDir, 'dist')
    options.distManifest = require(resolve(options.distDir, 'client/ssr-manifest.json'))
  } else {
    options.distManifest = []
  }

  // Setup appropriate Vite route handler
  // For dev you get more detailed logging and sautoreload 
  if (options.dev) {
    const viteDevServer = await vite.createServer({
      root: options.rootDir,
      logLevel: 'error',
      server: { middlewareMode: true },
    })
    await fastify.register(middie)
    fastify.use(viteDevServer.middlewares)
    
    const getTemplate = getTemplateGetter(options)
    handler = getHandler(options, getTemplate, viteDevServer)
    fastify.decorate('viteDevServer', viteDevServer)
  } else {
    fastify.register(static, {
      root: resolve(options.distDir, 'client'),
      prefix: options.publicPath || '/static/', // fixme
    })
    const getTemplate = getTemplateGetter(options)
    handler = getHandler(options, getTemplate, viteApp)
  }

  // Pre-initialize request decorator (better performance?)
  fastify.decorateRequest(options.ssrDataKey, null)

  // Sets fastify.vite.get() helper which uses
  // a wrapper for setting a route with a ssrData handler
  fastify.decorate('vite', {
    handler,
    get (url, { ssrData, ...routeOptions }) {
      let preHandler
      if (ssrData) {
        preHandler = async function (req, reply) {
          req[options.ssrDataKey] = await ssrData.call(this, req, reply)
        }
      }
      fastify.get(`${url}/data`, async function (req, reply) {
        return ssrData.call(this, req, reply)
      })
      fastify.route({
        method: 'GET',
        url,
        preHandler,
        handler,
        ...routeOptions,
      })
    },
  })
}

class FastifyViteError extends Error {}

module.exports = fp(fastifyVite)
