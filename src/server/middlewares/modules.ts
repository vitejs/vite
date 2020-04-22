import { Middleware } from '../index'
import { resolveVue } from '../resolveVue'
import path from 'path'
import { createReadStream } from 'fs'
import resolve from 'resolve-from'
import { Readable } from 'stream'
import { parse } from '@babel/parser'
import MagicString from 'magic-string'

const idToFileMap = new Map()
const fileToIdMap = new Map()

export const moduleResolverMiddleware: Middleware = ({ root, app }) => {
  // rewrite named module imports to `/__modules/:id` requests
  app.use(async (ctx, next) => {
    await next()

    if (ctx.url === '/index.html') {
      const html = await readStream(ctx.body)
      ctx.body = html.replace(
        /(<script\b[^>]*>)([\s\S]*?)<\/script>/gm,
        (_, openTag, script) => {
          return `${openTag}${rewriteImports(script)}</script>`
        }
      )
    }

    // we are doing the js rewrite after all other middlewares have finished;
    // this allows us to post-process javascript produced any user middlewares
    // regardless of the extension of the original files.
    if (
      ctx.response.is('js') &&
      // skip dependency modules
      !ctx.path.startsWith(`/__`) &&
      // only need to rewrite for <script> part in vue files
      !(ctx.path.endsWith('.vue') && ctx.query.type != null)
    ) {
      ctx.body = rewriteImports(
        await readStream(ctx.body),
        // if this is a vue file script, rewrite default export
        ctx.path.endsWith('.vue')
      )
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
      ctx.body = createReadStream(resolveVue(root).vue)
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
      const pkgPath = resolve(root, `${id}/package.json`)
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

async function readStream(stream: Readable | string): Promise<string> {
  if (stream instanceof Readable) {
    return new Promise((resolve, reject) => {
      let res = ''
      stream
        .on('data', (chunk) => (res += chunk))
        .on('error', reject)
        .on('end', () => {
          resolve(res)
        })
    })
  } else {
    return stream
  }
}

function rewriteImports(source: string, asSFCScript = false) {
  const ast = parse(source, {
    sourceType: 'module',
    plugins: [
      // by default we enable proposals slated for ES2020.
      // full list at https://babeljs.io/docs/en/next/babel-parser#plugins
      // this will need to be updated as the spec moves forward.
      'bigInt',
      'optionalChaining',
      'nullishCoalescingOperator'
    ]
  }).program.body

  const s = new MagicString(source)
  ast.forEach((node) => {
    if (node.type === 'ImportDeclaration') {
      if (/^[^\.\/]/.test(node.source.value)) {
        // module import
        // import { foo } from 'vue' --> import { foo } from '/__modules/vue'
        s.overwrite(
          node.source.start!,
          node.source.end!,
          `"/__modules/${node.source.value}"`
        )
      }
    } else if (asSFCScript && node.type === 'ExportDefaultDeclaration') {
      s.overwrite(
        node.start!,
        node.declaration.start!,
        `let __script; export default (__script = `
      )
      s.appendRight(node.end!, `)`)
    }
  })

  return s.toString()
}
