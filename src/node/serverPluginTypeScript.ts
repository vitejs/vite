import { Plugin } from './server'
import { readBody, isImportRequest } from './utils'
import { parse as parseImports } from 'es-module-lexer'
import MagicString from 'magic-string'
import { transform } from './esbuildService'

export const tsPlugin: Plugin = ({ root, app, watcher }) => {
  app.use(async (ctx, next) => {
    await next()
    if (ctx.path.endsWith('.ts') && isImportRequest(ctx) && ctx.body) {
      ctx.type = 'js'
      ctx.body = await compileTs(
        (await readBody(ctx.body)) as string,
        ctx.path,
        root
      )
    }
  })

  watcher.on('change', (file) => {
    if (file.endsWith('.ts')) {
      watcher.handleJSReload(file)
    }
  })
}

export async function compileTs(
  source: string,
  path: string,
  root: string
): Promise<string> {
  const { code } = await transform(source, path, { loader: 'ts' })
  return renameTsImport(code)
}

// import './a' => import './a.ts
function renameTsImport(source: string) {
  try {
    const [imports] = parseImports(source)
    const s = new MagicString(source)
    let hasReplaced = false
    imports.forEach(({ s: start, e: end, d: dynamicIndex }) => {
      let id = source.substring(start, end)
      if (!/\.(css|json|js|vue)$/.test(id)) {
        s.overwrite(start, end, `${id}.ts`)
        hasReplaced = true
      }
    })
    return hasReplaced ? s.toString() : source
  } catch (e) {
    console.error(
      `[vite] Error: typescript module imports rename failed for ${source}.\n`,
      e
    )
    return source
  }
}
