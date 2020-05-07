import path from 'path'
import resolve from 'resolve-from'
import sfcCompiler from '@vue/compiler-sfc'
import chalk from 'chalk'

interface ResolvedVuePaths {
  runtime: string
  compiler: string
  version: string
  isLocal: boolean
  cdnLink: string
}

let resolved: ResolvedVuePaths | undefined = undefined

// Resolve the correct `vue` and `@vue.compiler-sfc` to use.
// If the user project has local installations of these, they should be used;
// otherwise, fallback to the dependency of Vite itself.
export function resolveVue(root: string): ResolvedVuePaths {
  if (resolved) {
    return resolved
  }
  let runtimePath: string
  let compilerPath: string
  let isLocal = true
  let vueVersion: string
  try {
    // see if user has local vue installation
    const userVuePkg = resolve(root, 'vue/package.json')
    vueVersion = require(userVuePkg).version
    runtimePath = path.join(
      path.dirname(userVuePkg),
      'dist/vue.runtime.esm-bundler.js'
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
        chalk.red(
          `[vite] Error: a local installation of \`vue\` is detected but ` +
            `no matching \`@vue/compiler-sfc\` is found. Make sure to install ` +
            `both and use the same version.`
        )
      )
      compilerPath = require.resolve('@vue/compiler-sfc')
    }
  } catch (e) {
    // user has no local vue, use vite's dependency version
    isLocal = false
    vueVersion = require('vue/package.json').version
    runtimePath = require.resolve('vue/dist/vue.runtime.esm-bundler.js')
    compilerPath = require.resolve('@vue/compiler-sfc')
  }
  resolved = {
    version: vueVersion,
    runtime: runtimePath,
    compiler: compilerPath,
    isLocal,
    cdnLink: `https://unpkg.com/vue@${vueVersion}/dist/vue.esm-browser.prod.js`
  }
  return resolved
}

export function resolveCompiler(cwd: string): typeof sfcCompiler {
  return require(resolveVue(cwd).compiler)
}
