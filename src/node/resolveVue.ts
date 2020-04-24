import path from 'path'
import resolve from 'resolve-from'
import sfcCompiler from '@vue/compiler-sfc'

interface ResolvedVuePaths {
  vue: string
  hasLocalVue: boolean
  compiler: string
}

let resolved: ResolvedVuePaths | undefined = undefined

const toBuildPaths = (p: ResolvedVuePaths) => ({
  ...p,
  vue: p.vue.replace('esm-browser', 'esm-bundler')
})

// Resolve the correct `vue` and `@vue.compiler-sfc` to use.
// If the user project has local installations of these, they should be used;
// otherwise, fallback to the dependency of Vite itself.
export function resolveVue(root: string, isBuild = false): ResolvedVuePaths {
  if (resolved) {
    return isBuild ? toBuildPaths(resolved) : resolved
  }
  let vuePath: string
  let compilerPath: string
  let hasLocalVue = true
  try {
    // see if user has local vue installation
    const userVuePkg = resolve(root, 'vue/package.json')
    vuePath = path.join(
      path.dirname(userVuePkg),
      'dist/vue.runtime.esm-browser.js'
    )

    // also resolve matching sfc compiler
    try {
      const compilerPkgPath = resolve(root, '@vue/compiler-sfc/package.json')
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
    hasLocalVue = false
    vuePath = require.resolve('vue/dist/vue.runtime.esm-browser.js')
    compilerPath = require.resolve('@vue/compiler-sfc')
  }
  resolved = {
    vue: vuePath,
    hasLocalVue,
    compiler: compilerPath
  }
  return isBuild ? toBuildPaths(resolved) : resolved
}

export function resolveCompiler(cwd: string): typeof sfcCompiler {
  return require(resolveVue(cwd).compiler)
}
