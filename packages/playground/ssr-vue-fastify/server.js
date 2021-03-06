const fs = require('fs')
const { resolve } = require('path')
const Fastify = require('fastify')
const FastifyVitePlugin = require('./plugin')

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITE_TEST_BUILD

async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === 'production'
) {
  const fastify = new Fastify()

  await fastify.register(FastifyVitePlugin, {
    dev: true,
    rootDir: resolve(__dirname),
    srcDir: resolve(__dirname, 'src'),
  })

  fastify.vite.get('/with-data', {
    ssrData (req) {
      return { message: `Hello from ${req.raw.url}` }
    }
  })
  fastify.get('/*', fastify.vite.handler)

  return { fastify, vite: fastify.$vite }
}

if (!isTest) {
  createServer().then(({ fastify }) =>
    fastify.listen(3000, (err, address) => {
      if (err) {
        console.error(err)
        process.exit(1)
      }
      console.log(`Server listening on ${address}`)
    })
  )
}

// for test use
exports.createServer = createServer
