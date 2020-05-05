import { Plugin } from './server'
import { readBody, isImportRequest } from './utils'
import ts, { CompilerOptions } from 'typescript'
import { parse as parseImports } from 'es-module-lexer'
import MagicString from 'magic-string'
import path from 'path'

export const tsPlugin: Plugin = ({ root, app, watcher }) => {
  app.use(async (ctx, next) => {
    await next()
    if (ctx.path.endsWith('.ts') && isImportRequest(ctx) && ctx.body) {
      ctx.type = 'js'
      ctx.body = compileTs((await readBody(ctx.body)) as string, root)
    }
  })

  watcher.on('change', (file) => {
    if (file.endsWith('.ts')) {
      watcher.handleJSReload(file)
    }
  })
}

export function compileTs(source: string, root: string): string {
  let { outputText } = ts.transpileModule(source, {
    compilerOptions: loadTsconfig(root)
  })
  return renameTsImport(outputText)
}

let cachedTsConfig: undefined | CompilerOptions

function loadTsconfig(root: string): CompilerOptions {
  if (cachedTsConfig) return cachedTsConfig
  let compilerOptions = { module: ts.ModuleKind.ESNext }
  try {
    const tsconfigPath = path.resolve(root, 'tsconfig.json')
    const tsconfig = require(tsconfigPath)
    compilerOptions = { ...tsconfig.compilerOptions, ...compilerOptions }
  } catch (e) {}
  return (cachedTsConfig = compilerOptions)
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
