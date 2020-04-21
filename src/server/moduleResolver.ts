import path from 'path'
import resolve from 'resolve-from'
import { sendJSStream } from './utils'
import { ServerResponse } from 'http'
import { parse, compileTemplate, compileStyle } from '@vue/compiler-sfc'

const fileToIdMap = new Map()
const resolveCache = new Map()

const sendWithCache = (res: ServerResponse, id: string, modulePath: string) => {
  resolveCache.set(id, modulePath)
  sendJSStream(res, modulePath)
}

export function resolveVue(cwd: string) {
  if (resolveCache.has('vue')) {
    return resolveCache.get('vue')
  }
  let vuePath: string
  let compilerPath: string
  try {
    // see if user has local vue installation
    const userVuePkg = resolve(cwd, 'vue/package.json')
    vuePath = path.join(
      path.dirname(userVuePkg),
      'dist/vue.runtime.esm-browser.js'
    )

    // also resolve matching sfc
    try {
      const compilerPkgPath = resolve(cwd, '@vue/compiler-sfc/package.json')
      const compilerPkg = require(compilerPkgPath)
      if (compilerPkg.version !== require(userVuePkg).version) {
        throw new Error()
      }
      compilerPath = path.join(path.dirname(compilerPkgPath), compilerPkg.main)
    } catch (e) {
      // user has local vue but has no compiler-sfc
      console.error(
        `[vite] Error: a local installation of \`vue\` is detected but ` +
          `no matching \`@vue/compiler-sfc\` is found. Make sure to install ` +
          `both and use the same version.`
      )
      compilerPath = require.resolve('@vue/compiler-sfc')
    }
  } catch (e) {
    // user has no local vue, use vite's dependency version
    vuePath = require.resolve('vue/dist/vue.runtime.esm-browser.js')
    compilerPath = require.resolve('@vue/compiler-sfc')
  }
  resolveCache.set('vue', vuePath)
  resolveCache.set('@vue/compiler-sfc', compilerPath)
  return vuePath
}

export function resolveCompiler(
  cwd: string
): {
  parse: typeof parse
  compileTemplate: typeof compileTemplate
  compileStyle: typeof compileStyle
} {
  resolveVue(cwd)
  return require(resolveCache.get('@vue/compiler-sfc'))
}

// TODO support custom imports map e.g. for snowpack web_modules
export function resolveModule(id: string, cwd: string, res: ServerResponse) {
  if (id === 'vue') {
    // special handling for vue
    return sendJSStream(res, resolveVue(cwd))
  }

  // already cached
  let modulePath: string | undefined = resolveCache.get(id)
  if (modulePath) {
    return sendJSStream(res, modulePath)
  }

  // handle source map requests
  let sourceMapPath: string | undefined = undefined
  if (id.endsWith('.map')) {
    sourceMapPath = id
    id = fileToIdMap.get(id.replace(/\.map$/, ''))
    if (!id) {
      res.statusCode = 404
      res.end()
      return
    }
  }

  // fallback to node resolve
  try {
    modulePath = resolve(cwd, `${id}/package.json`)
    // module resolved, try to locate its "module" entry
    const pkg = require(modulePath)
    modulePath = path.join(path.dirname(modulePath), pkg.module || pkg.main)
    fileToIdMap.set(path.basename(modulePath), id)
    // this is a source map request.
    if (sourceMapPath) {
      modulePath = path.join(path.dirname(modulePath), sourceMapPath)
      return sendWithCache(res, sourceMapPath, modulePath)
    }
    sendWithCache(res, id, modulePath)
  } catch (e) {
    console.error(e)
    res.statusCode = 404
    res.end()
  }
}
