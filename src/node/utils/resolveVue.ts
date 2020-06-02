import path from 'path'
import fs from 'fs-extra'
import { resolveFrom } from './pathUtils'
import sfcCompiler from '@vue/compiler-sfc'
import chalk from 'chalk'
import { lookupFile } from './fsUtils'

interface ResolvedVuePaths {
  vue: string
  '@vue/runtime-dom': string
  '@vue/runtime-core': string
  '@vue/reactivity': string
  '@vue/shared': string
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
  let vueVersion: string
  let vueBasePath: string
  let compilerPath: string

  const projectPkg = JSON.parse(lookupFile(root, ['package.json']) || `{}`)
  let isLocal = !!(projectPkg.dependencies && projectPkg.dependencies.vue)
  if (isLocal) {
    try {
      const userVuePkg = resolveFrom(root, 'vue/package.json')
      vueBasePath = path.dirname(userVuePkg)
      vueVersion = fs.readJSONSync(userVuePkg).version
      isLocal = true
    } catch (e) {
      // user has vue listed but not actually installed.
      isLocal = false
    }
  }

  if (isLocal) {
    // user has local vue, verify that the same version of @vue/compiler-sfc
    // is also installed.
    try {
      const compilerPkgPath = resolveFrom(
        root,
        '@vue/compiler-sfc/package.json'
      )
      const compilerPkg = require(compilerPkgPath)
      if (compilerPkg.version !== vueVersion!) {
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
    vueBasePath = path.dirname(require.resolve('vue/package.json'))
    compilerPath = require.resolve('@vue/compiler-sfc')
  }

  const resolvePath = (name: string, from: string) =>
    resolveFrom(from, `@vue/${name}/dist/${name}.esm-bundler.js`)

  // resolve nested dependencies with correct base dirs so that this works with
  // strict package managers - e.g. pnpm / yarn 2
  const runtimeDomPath = resolvePath('runtime-dom', vueBasePath!)
  const runtimeCorePath = resolvePath('runtime-core', runtimeDomPath)
  const reactivityPath = resolvePath('reactivity', runtimeCorePath)
  const sharedPath = resolvePath('shared', runtimeCorePath)

  resolved = {
    version: vueVersion!,
    vue: runtimeDomPath,
    '@vue/runtime-dom': runtimeDomPath,
    '@vue/runtime-core': runtimeCorePath,
    '@vue/reactivity': reactivityPath,
    '@vue/shared': sharedPath,
    compiler: compilerPath,
    isLocal
  }
  return resolved
}

export function resolveCompiler(cwd: string): typeof sfcCompiler {
  return require(resolveVue(cwd).compiler)
}
