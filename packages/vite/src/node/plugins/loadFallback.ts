import fsp from 'node:fs/promises'
import path from 'node:path'
import type { SourceMap } from 'rollup'
import { cleanUrl } from '../../shared/utils'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import type { ViteDevServer } from '../server'
import { extractSourcemapFromFile } from '../server/sourcemap'
import { isFileServingAllowed } from '../server/middlewares/static'
import type { DevEnvironment } from '../server/environment'
import type { EnvironmentModuleNode } from '../server/moduleGraph'
import { ensureWatchedFile } from '../utils'
import { checkPublicFile } from '../publicDir'

export const ERR_LOAD_URL = 'ERR_LOAD_URL'
export const ERR_LOAD_PUBLIC_URL = 'ERR_LOAD_PUBLIC_URL'

/**
 * A plugin to provide build load fallback for arbitrary request with queries.
 */
export function loadFallbackPlugin(config: ResolvedConfig): Plugin {
  let server: ViteDevServer
  return {
    name: 'vite:load-fallback',
    configureServer(_server) {
      server = _server
    },
    async load(id, options) {
      const environment = this.environment as DevEnvironment
      if (!environment) {
        return
      }

      let code: string | null = null
      let map: SourceMap | null = null

      // if this is an html request and there is no load result, skip ahead to
      // SPA fallback.
      if (options?.html && !id.endsWith('.html')) {
        return null
      }
      // try fallback loading it from fs as string
      // if the file is a binary, there should be a plugin that already loaded it
      // as string
      // only try the fallback if access is allowed, skip for out of root url
      // like /service-worker.js or /api/users
      const file = cleanUrl(id)
      if (
        environment.options.nodeCompatible ||
        isFileServingAllowed(file, server)
      ) {
        try {
          code = await fsp.readFile(file, 'utf-8')
        } catch (e) {
          if (e.code !== 'ENOENT') {
            if (e.code === 'EISDIR') {
              e.message = `${e.message} ${file}`
            }
            throw e
          }
        }
        if (code != null && environment.watcher) {
          ensureWatchedFile(environment.watcher, file, config.root)
        }
      }
      if (code) {
        try {
          const extracted = await extractSourcemapFromFile(code, file)
          if (extracted) {
            code = extracted.code
            map = extracted.map
          }
        } catch (e) {
          environment.logger.warn(
            `Failed to load source map for ${file}.\n${e}`,
            {
              timestamp: true,
            },
          )
        }
        return { code, map }
      }

      const isPublicFile = checkPublicFile(id, config)
      let publicDirName = path.relative(config.root, config.publicDir)
      if (publicDirName[0] !== '.') publicDirName = '/' + publicDirName
      const msg = isPublicFile
        ? `This file is in ${publicDirName} and will be copied as-is during ` +
          `build without going through the plugin transforms, and therefore ` +
          `should not be imported from source code. It can only be referenced ` +
          `via HTML tags.`
        : `Does the file exist?`
      const importerMod: EnvironmentModuleNode | undefined =
        environment.moduleGraph.idToModuleMap
          .get(id)
          ?.importers.values()
          .next().value
      const importer = importerMod?.file || importerMod?.url
      const err: any = new Error(
        `Failed to load ${id}${importer ? ` in ${importer}` : ''}. ${msg}`,
      )
      err.code = isPublicFile ? ERR_LOAD_PUBLIC_URL : ERR_LOAD_URL
      throw err
    },
  }
}

/**
 * A plugin to provide build load fallback for arbitrary request with queries.
 */
export function buildLoadFallbackPlugin(): Plugin {
  return {
    name: 'vite:build-load-fallback',
    async load(id) {
      try {
        const cleanedId = cleanUrl(id)
        const content = await fsp.readFile(cleanedId, 'utf-8')
        this.addWatchFile(cleanedId)
        return content
      } catch (e) {
        const content = await fsp.readFile(id, 'utf-8')
        this.addWatchFile(id)
        return content
      }
    },
  }
}
