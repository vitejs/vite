import path from 'path'
import { resolveFrom } from './pathUtils'
import sfcCompiler from '@vue/compiler-sfc'
import chalk from 'chalk'
import { lookupFile } from './fsUtils'

interface ResolvedVuePaths {
  vue: string | undefined
  '@vue/runtime-dom': string | undefined
  '@vue/runtime-core': string | undefined
  '@vue/reactivity': string | undefined
  '@vue/shared': string | undefined
  compiler: string
  version: string
  isLocal: boolean
}

let resolved: ResolvedVuePaths | undefined = undefined

// Resolve the correct `vue` and `@vue.compiler-sfc` to use.
// If the user project has local installations of these, they should be used;
// otherwise, fallback to the dependency of Vite itself.
export function resolveVue(root: string): ResolvedVuePaths {
  if (resolved) {
    return resolved
  }
  let vueVersion: string | undefined
  let vuePath: string | undefined
  let compilerPath: string

  const projectPkg = JSON.parse(lookupFile(root, ['package.json']) || `{}`)
  let isLocal = !!(projectPkg.dependencies && projectPkg.dependencies.vue)
  if (isLocal) {
    try {
      resolveFrom(root, 'vue')
    } catch (e) {
      // user has vue listed but not actually installed.
      isLocal = false
    }
  }

  if (isLocal) {
    // user has local vue, verify that the same version of @vue/compiler-sfc
    // is also installed.
    try {
      const userVuePkg = resolveFrom(root, 'vue/package.json')
      vueVersion = require(userVuePkg).version
      vuePath = resolveFrom(
        root,
        '@vue/runtime-dom/dist/runtime-dom.esm-bundler.js'
      )
      const compilerPkgPath = resolveFrom(
        root,
        '@vue/compiler-sfc/package.json'
      )
      const compilerPkg = require(compilerPkgPath)
      if (compilerPkg.version !== vueVersion) {
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
  } else {
    // user has no local vue, use vite's dependency version
    vueVersion = require('vue/package.json').version
    vuePath = require.resolve(
      '@vue/runtime-dom/dist/runtime-dom.esm-bundler.js'
    )
    compilerPath = require.resolve('@vue/compiler-sfc')
  }

  const inferPath = (name: string) =>
    vuePath && vuePath.replace(/runtime-dom/g, name)

  resolved = {
    version: vueVersion!,
    vue: vuePath,
    '@vue/runtime-dom': vuePath,
    '@vue/runtime-core': inferPath('runtime-core'),
    '@vue/reactivity': inferPath('reactivity'),
    '@vue/shared': inferPath('shared'),
    compiler: compilerPath,
    isLocal
  }
  return resolved
}

export function resolveCompiler(cwd: string): typeof sfcCompiler {
  return require(resolveVue(cwd).compiler)
}
