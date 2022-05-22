import { promises as fs } from 'fs'
import colors from 'picocolors'
import type { ResolvedConfig } from '..'
import type { Plugin } from '../plugin'
import { DEP_VERSION_RE } from '../constants'
import { cleanUrl, createDebugger } from '../utils'
import {
  isOptimizedDepFile,
  optimizedDepInfoFromFile,
  optimizedDepNeedsInterop
} from '../optimizer'
import { transformCjsImport } from './importAnalysis'
import { optimizedInteropProxyMap } from './importAnalysisBuild'

export const ERR_OPTIMIZE_DEPS_PROCESSING_ERROR =
  'ERR_OPTIMIZE_DEPS_PROCESSING_ERROR'
export const ERR_OUTDATED_OPTIMIZED_DEP = 'ERR_OUTDATED_OPTIMIZED_DEP'

const optimizedProxyQueryRE = /[\?&]optimized-proxy=([a-z\d]{8})/

const isDebug = process.env.DEBUG
const debug = createDebugger('vite:optimize-deps')

export function optimizedDepsPlugin(config: ResolvedConfig): Plugin {
  return {
    name: 'vite:optimized-deps',

    async load(id) {
      if (isOptimizedDepFile(id, config)) {
        const metadata = config._optimizedDeps?.metadata
        if (metadata) {
          const file = cleanUrl(id)
          const versionMatch = id.match(DEP_VERSION_RE)
          const browserHash = versionMatch
            ? versionMatch[1].split('=')[1]
            : undefined

          // Search in both the currently optimized and newly discovered deps
          const info = optimizedDepInfoFromFile(metadata, file)
          if (info) {
            if (browserHash && info.browserHash !== browserHash) {
              throwOutdatedRequest(id)
            }
            try {
              // This is an entry point, it may still not be bundled
              await info.processing
            } catch {
              // If the refresh has not happened after timeout, Vite considers
              // something unexpected has happened. In this case, Vite
              // returns an empty response that will error.
              throwProcessingError(id)
              return
            }
            const newMetadata = config._optimizedDeps?.metadata
            if (metadata !== newMetadata) {
              const currentInfo = optimizedDepInfoFromFile(newMetadata!, file)
              if (info.browserHash !== currentInfo?.browserHash) {
                throwOutdatedRequest(id)
              }
            }
          }
          isDebug && debug(`load ${colors.cyan(file)}`)
          // Load the file from the cache instead of waiting for other plugin
          // load hooks to avoid race conditions, once processing is resolved,
          // we are sure that the file has been properly save to disk
          try {
            return await fs.readFile(file, 'utf-8')
          } catch (e) {
            // Outdated non-entry points (CHUNK), loaded after a rerun
            throwOutdatedRequest(id)
          }
        }
      }
    }
  }
}

export function optimizedDepsBuildPlugin(config: ResolvedConfig): Plugin {
  return {
    name: 'vite:optimized-deps-build',

    async resolveId(id) {
      if (isOptimizedDepFile(id, config)) {
        const optimizedProxyQuery = id.match(optimizedProxyQueryRE)
        const metadata = config._optimizedDeps!.metadata
        const file = cleanUrl(id)
        if (optimizedProxyQuery) {
          const needsInterop = await optimizedDepNeedsInterop(
            metadata,
            file,
            config
          )
          // Ensure that packages that don't need interop are resolved to the same file
          return needsInterop ? '\0' + id : file
        } else {
          return file
        }
      }
    },

    transform() {
      config._optimizedDeps?.delay()
    },

    async load(id) {
      const metadata = config._optimizedDeps?.metadata
      id = id.replace('\0', '')
      if (!metadata || !isOptimizedDepFile(id, config)) {
        return
      }
      const file = cleanUrl(id)
      // Search in both the currently optimized and newly discovered deps
      const info = optimizedDepInfoFromFile(metadata, file)
      if (info) {
        try {
          // This is an entry point, it may still not be bundled
          await info.processing
        } catch {
          // If the refresh has not happened after timeout, Vite considers
          // something unexpected has happened. In this case, Vite
          // returns an empty response that will error.
          // throwProcessingError(id)
          return
        }
        isDebug && debug(`load ${colors.cyan(file)}`)
      } else {
        // TODO: error
        return
      }

      const optimizedProxyQuery = id.match(optimizedProxyQueryRE)
      if (optimizedProxyQuery) {
        const expHash = optimizedProxyQuery[1]
        const exp = optimizedInteropProxyMap.get(config)!.get(expHash)!
        const proxyCode = transformCjsImport(exp, file, 'proxy', 0, true)
        return proxyCode
      }

      // Load the file from the cache instead of waiting for other plugin
      // load hooks to avoid race conditions, once processing is resolved,
      // we are sure that the file has been properly save to disk
      try {
        return await fs.readFile(file, 'utf-8')
      } catch (e) {
        // Outdated non-entry points (CHUNK), loaded after a rerun
        return ''
      }
    }
  }
}

function throwProcessingError(id: string) {
  const err: any = new Error(
    `Something unexpected happened while optimizing "${id}". ` +
      `The current page should have reloaded by now`
  )
  err.code = ERR_OPTIMIZE_DEPS_PROCESSING_ERROR
  // This error will be caught by the transform middleware that will
  // send a 504 status code request timeout
  throw err
}

function throwOutdatedRequest(id: string) {
  const err: any = new Error(
    `There is a new version of the pre-bundle for "${id}", ` +
      `a page reload is going to ask for it.`
  )
  err.code = ERR_OUTDATED_OPTIMIZED_DEP
  // This error will be caught by the transform middleware that will
  // send a 504 status code request timeout
  throw err
}
