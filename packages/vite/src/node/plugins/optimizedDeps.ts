import fsp from 'node:fs/promises'
import colors from 'picocolors'
import type { DevEnvironment } from '..'
import type { Plugin } from '../plugin'
import {
  DEP_VERSION_RE,
  ERR_FILE_NOT_FOUND_IN_OPTIMIZED_DEP_DIR,
  ERR_OPTIMIZE_DEPS_PROCESSING_ERROR,
} from '../constants'
import { createDebugger } from '../utils'
import {
  isDepOptimizationDisabled,
  optimizedDepInfoFromFile,
} from '../optimizer'
import { cleanUrl } from '../../shared/utils'
import { ERR_OUTDATED_OPTIMIZED_DEP } from '../../shared/constants'

const debug = createDebugger('vite:optimize-deps')

export function optimizedDepsPlugin(): Plugin {
  return {
    name: 'vite:optimized-deps',

    applyToEnvironment(environment) {
      return !isDepOptimizationDisabled(environment.config.optimizeDeps)
    },

    resolveId(id) {
      const environment = this.environment as DevEnvironment
      if (environment.depsOptimizer?.isOptimizedDepFile(id)) {
        return id
      }
    },

    // this.load({ id }) isn't implemented in PluginContainer
    // The logic to register an id to wait until it is processed
    // is in importAnalysis, see call to delayDepsOptimizerUntil

    async load(id) {
      const environment = this.environment as DevEnvironment
      const depsOptimizer = environment.depsOptimizer
      if (depsOptimizer?.isOptimizedDepFile(id)) {
        const metadata = depsOptimizer.metadata
        const file = cleanUrl(id)
        const versionMatch = DEP_VERSION_RE.exec(file)
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
          }
          const newMetadata = depsOptimizer.metadata
          if (metadata !== newMetadata) {
            const currentInfo = optimizedDepInfoFromFile(newMetadata!, file)
            if (info.browserHash !== currentInfo?.browserHash) {
              throwOutdatedRequest(id)
            }
          }
        }
        debug?.(`load ${colors.cyan(file)}`)
        // Load the file from the cache instead of waiting for other plugin
        // load hooks to avoid race conditions, once processing is resolved,
        // we are sure that the file has been properly save to disk
        try {
          return await fsp.readFile(file, 'utf-8')
        } catch {
          const newMetadata = depsOptimizer.metadata
          if (optimizedDepInfoFromFile(newMetadata, file)) {
            // Outdated non-entry points (CHUNK), loaded after a rerun
            throwOutdatedRequest(id)
          }
          throwFileNotFoundInOptimizedDep(id)
        }
      }
    },
  }
}

function throwProcessingError(id: string): never {
  const err: any = new Error(
    `Something unexpected happened while optimizing "${id}". ` +
      `The current page should have reloaded by now`,
  )
  err.code = ERR_OPTIMIZE_DEPS_PROCESSING_ERROR
  // This error will be caught by the transform middleware that will
  // send a 504 status code request timeout
  throw err
}

export function throwOutdatedRequest(id: string): never {
  const err: any = new Error(
    `There is a new version of the pre-bundle for "${id}", ` +
      `a page reload is going to ask for it.`,
  )
  err.code = ERR_OUTDATED_OPTIMIZED_DEP
  // This error will be caught by the transform middleware that will
  // send a 504 status code request timeout
  throw err
}

export function throwFileNotFoundInOptimizedDep(id: string): never {
  const err: any = new Error(
    `The file does not exist at "${id}" which is in the optimize deps directory. ` +
      `The dependency might be incompatible with the dep optimizer. ` +
      `Try adding it to \`optimizeDeps.exclude\`.`,
  )
  err.code = ERR_FILE_NOT_FOUND_IN_OPTIMIZED_DEP_DIR
  // This error will be caught by the transform middleware that will
  // send a 404 status code not found
  throw err
}
