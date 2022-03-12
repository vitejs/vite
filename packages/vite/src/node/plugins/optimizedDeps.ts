import { promises as fs } from 'fs'
import type { Plugin } from '../plugin'
import colors from 'picocolors'
import { DEP_VERSION_RE } from '../constants'
import { cleanUrl, createDebugger } from '../utils'
import { isOptimizedDepFile, optimizeDepInfoFromFile } from '../optimizer'
import type { ViteDevServer } from '..'

export const ERR_OPTIMIZE_DEPS_PROCESSING_ERROR =
  'ERR_OPTIMIZE_DEPS_PROCESSING_ERROR'
export const ERR_OUTDATED_OPTIMIZED_DEP = 'ERR_OUTDATED_OPTIMIZED_DEP'

const isDebug = process.env.DEBUG
const debug = createDebugger('vite:optimize-deps')

export function optimizedDepsPlugin(): Plugin {
  let server: ViteDevServer | undefined

  return {
    name: 'vite:optimized-deps',

    configureServer(_server) {
      server = _server
    },

    async load(id) {
      if (server && isOptimizedDepFile(id, server.config)) {
        const metadata = server?._optimizeDepsMetadata
        if (metadata) {
          const file = cleanUrl(id)
          const versionMatch = id.match(DEP_VERSION_RE)
          const browserHash = versionMatch
            ? versionMatch[1].split('=')[1]
            : undefined

          // Search in both the currently optimized and newly discovered deps
          const info = optimizeDepInfoFromFile(metadata, file)
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
            const newMetadata = server._optimizeDepsMetadata
            if (metadata !== newMetadata) {
              const currentInfo = optimizeDepInfoFromFile(newMetadata!, file)
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
