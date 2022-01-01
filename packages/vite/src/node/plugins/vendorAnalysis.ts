import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import type { ModuleInfo } from 'rollup'
import type { ImportSpecifier } from 'es-module-lexer'
import { init, parse as parseImports } from 'es-module-lexer'
import { isCSSRequest } from './css'
import { createDebugger, timeFrom } from '../utils'
import { performance } from 'perf_hooks'

const isDebug = !!process.env.DEBUG
const debug = createDebugger('vite:vendor-analysis')

/**
 * Build only. Analyze which modules are used by entries and
 * generate manualChunks config to split those files to vendor.
 */
export function buildVendorAnalysisPlugin(config: ResolvedConfig): Plugin {
  const vendorImports = new Set<string>()
  return {
    name: 'vite:vendor-analysis',
    async buildEnd() {
      await init

      const entrieIds = new Set<string>()
      const importsCache = new Map<string, readonly ImportSpecifier[]>()
      const exportsCache = new Map<string, readonly string[]>()
      const parseImps = async (
        info: ModuleInfo,
        trace: string[]
      ): Promise<[readonly ImportSpecifier[], readonly string[]]> => {
        // circular dependency
        if (trace.includes(info.id))
          return [
            importsCache.get(info.id) || [],
            exportsCache.get(info.id) || []
          ]
        trace.push(info.id)

        const [imports, exps] = parseImports(info.code!)
        const exports = [...exps]

        // process export *
        for (const imp of imports) {
          // don't process dynamic imports
          if (imp.d !== -1 || !imp.n) continue
          // resolve the absolute id
          const id = (await this.resolve(imp.n, info.id))?.id
          if (!id) continue
          const rinfo = this.getModuleInfo(id)
          if (!rinfo || !rinfo.code) continue
          const statment: string = info.code!.substring(imp.ss, imp.se)
          if (
            statment.startsWith('export *') &&
            !statment.startsWith('export * as')
          ) {
            // merge all exports from module
            ;(await findExports(rinfo, trace)).forEach((exp) => {
              exports.push(exp)
            })
          }
        }

        importsCache.set(info.id, imports)
        exportsCache.set(info.id, exports)
        return [imports, exports]
      }
      const findImports = async (info: ModuleInfo, trace: string[] = []) => {
        if (!info.code) return []
        if (importsCache.has(info.id)) {
          return importsCache.get(info.id)!
        }
        return (await parseImps(info, trace))[0]
      }
      const findExports = async (info: ModuleInfo, trace: string[] = []) => {
        if (!info.code) return []
        if (exportsCache.has(info.id)) {
          return exportsCache.get(info.id)!
        }
        return (await parseImps(info, trace))[1]
      }

      /* find all redirects */
      const redirects = new Map<string, string>()
      let modulesAnalyzed = 0
      const collectRedirectsStart = performance.now()
      await Promise.all(
        Array.from(this.getModuleIds()).map(async (module) => {
          modulesAnalyzed++
          const info = this.getModuleInfo(module)
          if (info && info.code) {
            if (info.isEntry) entrieIds.add(module)
            // get all imports from module
            const imports = await findImports(info)
            for (const imp of imports) {
              // don't process dynamic imports
              if (imp.d !== -1 || !imp.n) continue
              // resolve the absolute id
              const id = (await this.resolve(imp.n, module))?.id
              if (!id) continue
              const statment: string = info.code.substring(imp.ss, imp.se)
              if (statment.startsWith('export * as')) {
                // export * as foo from "foo.js"
                const name = statment.substring(12).split(' ', 2)[0]
                redirects.set(info.id + '/+/' + name, id + '/+/*')
              } else if (statment.startsWith('export *')) {
                // export * from "foo.js"
                const impInfo = this.getModuleInfo(id)
                if (!impInfo) continue
                const exports = await findExports(impInfo)
                for (const exp of exports) {
                  redirects.set(info.id + '/+/' + exp, id + '/+/' + exp)
                }
              } else {
                // match export from statement
                const [, impDef, imps] =
                  statment.match(/export\s+(?:([^,]+)\s*,\s*)?{([^}]+)/) || []
                // default import
                if (impDef) {
                  redirects.set(info.id + '/+/' + impDef, id + '/+/default')
                }
                // named imports
                if (imps) {
                  for (const name of imps.split(',')) {
                    const [, impName, alias] =
                      name.trim().match(/([\S]+)(?:\s+as\s+([\S]+))?/) || []
                    if (!impName) continue
                    const varName = alias || impName

                    redirects.set(
                      info.id + '/+/' + varName,
                      id + '/+/' + impName
                    )
                  }
                }
              }
            }
          }
        })
      )
      isDebug && debug(`${timeFrom(collectRedirectsStart)} collect redirects`)

      /* trace all files imported by entry */
      const traced = new Set<string>()
      const traceImport = async (ids: Set<string>, imps: Set<string>) => {
        const nextids = new Set<string>()
        // push the import to vendor
        const addImport = (imp: string) => {
          // if it's a redirect, use the resolved id
          const getTrueImp = (imp: string): string =>
            redirects.has(imp) ? getTrueImp(redirects.get(imp)!) : imp
          const trueImp = getTrueImp(imp)
          const impId = trueImp.split('/+/', 2)[0]
          imps.add(trueImp)
          nextids.add(impId)
        }
        await Promise.all(
          Array.from(ids).map(async (module) => {
            if (traced.has(module)) return
            traced.add(module)
            const info = this.getModuleInfo(module)
            if (!info || !info.code) return
            // get all imports from module
            const imports = await findImports(info)
            for (const imp of imports) {
              // ignore dynamic imports
              if (imp.d !== -1 || !imp.n) continue
              // resolve the absolute id
              const id = (await this.resolve(imp.n, module))?.id
              if (!id) continue
              const statment: string = info.code.substring(imp.ss, imp.se)
              if (
                statment.startsWith('import "') ||
                statment.startsWith("import '") ||
                statment.startsWith('import *')
              ) {
                // import "foo.js"
                // import * as foo from "foo.js"
                nextids.add(id)
              } else {
                // import def, { foo, bar } from "foo.js"

                // impDef: def
                // imps:  foo, bar
                const [, impDef, imps] =
                  statment.match(
                    /(?:import|export)\s+(?:([^,\s{]+)\s*)?(?:\s*,\s*)?(?:\{([^\}]+))?/
                  ) || []

                // default import
                if (impDef) {
                  addImport(id + '/+/default')
                }
                // named imports
                if (imps) {
                  for (const name of imps.split(',')) {
                    const [, impName] =
                      name.trim().match(/([\S]+)(?:\s+as\s+([\S]+))?/) || []
                    if (!impName) continue
                    addImport(id + '/+/' + impName)
                  }
                }
              }
            }
          })
        )
        if (nextids.size) await traceImport(nextids, imps)
      }
      const vendorImps = new Set<string>()
      const startTrace = performance.now()
      await traceImport(entrieIds, vendorImps)
      isDebug && debug(`${timeFrom(startTrace)} trace imports`)

      /* collect all files imported by entry */
      for (const imp of vendorImps) {
        const file = imp.split('/+/', 2)[0]
        if (file.includes('node_modules')) vendorImports.add(file)
      }

      isDebug &&
        debug(
          `${modulesAnalyzed} modules analyzed, ${entrieIds.size} entries, ${vendorImports.size} vendor files`
        )
    },
    outputOptions(options) {
      if (
        // allow setting `manualChunks` to `undefined` to disable vendor chunk
        'manualChunks' in options ||
        // @ts-ignore injected by buildOutputOptions
        !options.__vite_vendor_chunk__
      ) {
        isDebug && debug('vendor chunk disabled')
        return
      }
      return {
        ...options,
        manualChunks(id) {
          if (vendorImports.has(id) && !isCSSRequest(id)) {
            return 'vendor'
          }
        }
      }
    }
  }
}
