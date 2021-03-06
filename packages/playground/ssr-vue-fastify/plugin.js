const { resolve } = require('path')
const vite = require('vite')

const Middie = require('middie')
const FastifyStatic = require('fastify-static')
const FastifyCompress = require('fastify-compress')

const { getHandler, getTemplateGetter } = require('./handler')

module.exports = async function (fastify, options) {
  if (!options.srcDir) {
    throw new FastifyViteError('srcDir required')
  }
  if (!options.dev) {
    options.distDir = resolve(options.rootDir, 'dist')
    options.distManifest = require(resolve(options.distDir, 'client/ssr-manifest.json'))
  } else {
    options.distManifest = []
  }
  if (options.decorate) {
    for (const [decorator, value] of Object.entries(options.decorate)) {
      fastify.decorate(decorator, value)
    }
  }
  if (options.dev) {
    const viteApp = await vite.createServer({
      root: options.rootDir,
      logLevel: options.dev ? 'error' : 'info',
      server: { middlewareMode: true },
    })
    await fastify.register(Middie)
    fastify.use(viteApp.middlewares)
    
    const getTemplate = getTemplateGetter(options)
    const handler = getHandler(options, getTemplate, viteApp)
    fastify.get('/*', handler)
  } else {
    fastify.register(FastifyCompress)
    fastify.register(FastifyStatic, {
      root: resolve(options.distDir, 'client'),
      prefix: options.publicPath || '/static/', // fixme
    })
    const getTemplate = getTemplateGetter(options)
    const handler = getHandler(options, getTemplate, viteApp)
    fastify.get('/*', handler)
  }
}

class FastifyViteError extends Error {}
