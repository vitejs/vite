import { Middleware } from '../index'
import { resolveVue } from '../vueResolver'
import path from 'path'
import { promises as fs, createReadStream } from 'fs'
import resolve from 'resolve-from'
import { rewrite } from '../moduleRewriter'
import { Readable } from 'stream'

const idToFileMap = new Map()
const fileToIdMap = new Map()

export const moduleResolverMiddleware: Middleware = ({ cwd, app }) => {
  // rewrite <script> imports in index.html
  app.use(async (ctx, next) => {
    await next()
    if (ctx.url === '/index.html') {
      const html = ctx.body.pipe ? await readStream(ctx.body) : String(ctx.body)
      ctx.body = html.replace(
        /(<script\b[^>]*>)([\s\S]*?)<\/script>/gm,
        (_, openTag, script) => {
          return `${openTag}${rewrite(script)}</script>`
        }
      )
      console.log(ctx.body)
    }
  })

  // rewrite imports in all js files to /__modules/:id
  app.use(async (ctx, next) => {
    if (!ctx.path.endsWith('.js')) {
      return next()
    }
    try {
      const filepath = path.join(cwd, ctx.path.slice(1))
      const raw = await fs.readFile(filepath, 'utf-8')
      ctx.type = 'js'
      ctx.body = rewrite(raw)
    } catch (e) {
      ctx.status = 404
      if (e.code !== 'ENOENT') {
        console.error(e)
      }
    }
  })

  // handle /__modules/:id requests
  const moduleRE = /^\/__modules\//
  app.use(async (ctx, next) => {
    if (!moduleRE.test(ctx.path)) {
      return next()
    }

    const id = ctx.path.replace(moduleRE, '')
    ctx.type = 'js'

    // special handling for vue's runtime.
    if (id === 'vue') {
      ctx.body = createReadStream(resolveVue(cwd).vue)
      return
    }

    // already resolved and cached
    const cachedPath = idToFileMap.get(id)
    if (cachedPath) {
      ctx.body = createReadStream(cachedPath)
      return
    }

    // source map request
    if (id.endsWith('.map')) {
      // try to reverse-infer the original file that made the sourcemap request.
      // assumes the `.js` and `.js.map` files to have the same prefix.
      const sourceMapRequest = id
      const jsRequest = sourceMapRequest.replace(/\.map$/, '')
      const moduleId = fileToIdMap.get(jsRequest)
      if (!moduleId) {
        console.error(
          `[vite] failed to infer original js file for source map request ` +
            sourceMapRequest
        )
        ctx.status = 404
        return
      } else {
        const modulePath = idToFileMap.get(moduleId)
        const sourceMapPath = path.join(
          path.dirname(modulePath),
          sourceMapRequest
        )
        idToFileMap.set(sourceMapRequest, sourceMapPath)
        ctx.type = 'application/json'
        ctx.body = createReadStream(sourceMapPath)
        return
      }
    }

    // TODO support resolving from Snowpack's web_modules

    // resolve from node_modules
    try {
      const pkgPath = resolve(cwd, `${id}/package.json`)
      const pkg = require(pkgPath)
      const modulePath = path.join(
        path.dirname(pkgPath),
        pkg.module || pkg.main
      )
      idToFileMap.set(id, modulePath)
      fileToIdMap.set(path.basename(modulePath), id)
      ctx.body = createReadStream(modulePath)
    } catch (e) {
      console.error(e)
      ctx.status = 404
    }
  })
}

async function readStream(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    let res = ''
    stream
      .on('data', (chunk) => (res += chunk))
      .on('error', reject)
      .on('end', () => {
        resolve(res)
      })
  })
}
