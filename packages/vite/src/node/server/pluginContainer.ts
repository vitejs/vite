/**
 * This file is refactored into TypeScript based on
 * https://github.com/preactjs/wmr/blob/master/src/lib/rollup-plugin-container.js
 * Licensed under MIT
 * https://github.com/preactjs/wmr/blob/master/LICENSE
 */

import { resolve, relative, dirname, sep, posix } from 'path'
import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import { Plugin } from '../config'
import {
  RollupOptions,
  InputOptions,
  MinimalPluginContext,
  OutputOptions,
  ModuleInfo,
  ResolveIdResult,
  LoadResult,
  NormalizedInputOptions,
  ChangeEvent,
  PartialResolvedId,
  ResolvedId,
  PluginContext,
  TransformResult
} from 'rollup'
import * as acorn from 'acorn'
import acornClassFields from 'acorn-class-fields'

export interface PluginContainerOptions {
  cwd?: string
  output?: OutputOptions
  modules?: Map<string, { info: ModuleInfo }>
  writeFile?: (name: string, source: string | Uint8Array) => void
}

export interface PluginContainer {
  ctx: PluginContext
  options: InputOptions
  buildStart(options: InputOptions): Promise<void>
  watchChange(id: string, event?: ChangeEvent): void
  resolveImportMeta(id: string, property: string): void
  resolveId(
    id: string,
    importer?: string,
    skip?: Plugin[]
  ): Promise<ResolveIdResult>
  transform(code: string, id: string): Promise<TransformResult>
  load(id: string): Promise<LoadResult>
  resolveFileUrl(referenceId: string): string | null
}

const toPosixPath = (path: string) => path.split(sep).join(posix.sep)

function popIndex(array: any[], index: number) {
  const tail = array.pop()
  if (index !== array.length) array[index] = tail
}

function identifierPair(id: string, importer?: string) {
  if (importer) return id + '\n' + importer
  return id
}

export async function createPluginContainer(
  plugins: readonly Plugin[],
  opts: RollupOptions & PluginContainerOptions = {}
): Promise<PluginContainer> {
  const MODULES = opts.modules || new Map()

  const outputOptions = {
    dir: opts.output && opts.output.dir,
    file: opts.output && opts.output.file,
    entryFileNames: opts.output && opts.output.entryFileNames,
    chunkFileNames: opts.output && opts.output.chunkFileNames,
    assetFileNames: opts.output && opts.output.assetFileNames
  }

  function generateFilename(
    type: 'entry' | 'asset' | 'chunk',
    name: string,
    source: string | false | undefined | Uint8Array,
    fileName: string | undefined
  ) {
    const posixName = toPosixPath(name)
    if (!fileName) {
      fileName = ((type === 'entry' && outputOptions.file) ||
        // @ts-ignore
        outputOptions[`${type}FileNames`] ||
        '[name][extname]') as string
      fileName = fileName.replace('[hash]', () =>
        createHash('md5').update(String(source)).digest('hex').substring(0, 5)
      )
      fileName = fileName.replace('[extname]', posix.extname(posixName))
      fileName = fileName.replace(
        '[ext]',
        posix.extname(posixName).substring(1)
      )
      fileName = fileName.replace(
        '[name]',
        posix.basename(posixName).replace(/\.[a-z0-9]+$/g, '')
      )
    }
    const result = resolve(opts.cwd || '.', outputOptions.dir || '.', fileName)
    // console.log('filename for ' + name + ': ', result);
    return result
  }

  // counter for generating unique emitted asset IDs
  let ids = 0
  let files = new Map()

  let watchFiles = new Set()

  let plugin: Plugin | undefined
  let parser = acorn.Parser

  const minimalContext: MinimalPluginContext = {
    meta: {
      rollupVersion: '2.8.0',
      watchMode: true
    }
  }

  const ctx = {
    ...minimalContext,

    parse(code: string, opts: any = {}) {
      return parser.parse(code, {
        sourceType: 'module',
        ecmaVersion: 2020,
        locations: true,
        onComment: [],
        ...opts
      })
    },

    async resolve(id, importer, { skipSelf = false } = { skipSelf: false }) {
      const skip = []
      if (skipSelf && plugin) skip.push(plugin)
      let out = await container.resolveId(id, importer, skip)
      if (typeof out === 'string') out = { id: out }
      if (!out || !out.id) out = { id }
      if (out.id.match(/^\.\.?[/\\]/)) {
        out.id = resolve(
          opts.cwd || '.',
          importer ? dirname(importer) : '.',
          out.id
        )
      }
      return (out as ResolvedId) || null
    },

    getModuleInfo(id) {
      let mod = MODULES.get(id)
      if (mod) return mod.info
      mod = {
        /** @type {import('rollup').ModuleInfo} */
        // @ts-ignore-next
        info: {}
      }
      MODULES.set(id, mod)
      return mod.info
    },

    emitFile(assetOrFile) {
      const { type, name, fileName } = assetOrFile
      const source = assetOrFile.type === 'asset' && assetOrFile.source
      const id = String(++ids)
      const filename =
        fileName || generateFilename(type, name!, source, fileName)
      files.set(id, { id, name, filename })
      if (source) {
        if (type === 'chunk') {
          throw Error(`emitFile({ type:"chunk" }) cannot include a source`)
        }
        if (opts.writeFile) opts.writeFile(filename, source)
        else fs.writeFile(filename, source)
      }
      return id
    },

    setAssetSource(assetId, source) {
      const asset = files.get(String(assetId))
      if (asset.type === 'chunk') {
        throw Error(`setAssetSource() called on a chunk`)
      }
      asset.source = source
      if (opts.writeFile) opts.writeFile(asset.filename, source)
      else fs.writeFile(asset.filename, source)
    },

    getFileName(referenceId) {
      return container.resolveFileUrl(referenceId)!
    },

    addWatchFile(id) {
      watchFiles.add(id)
    },

    warn(...args) {
      // TODO
      console.log(`[${plugin!.name}]`, ...args)
    },

    error(...args) {
      // TODO
      console.error(`[${plugin!.name}]`, ...args)
      return null as never
    }
  } as PluginContext

  const container: PluginContainer = {
    ctx,

    options: await (async () => {
      let options = opts
      for (plugin of plugins) {
        if (!plugin.options) continue
        options = (await plugin.options.call(ctx, options)) || options
      }
      if (options.acornInjectPlugins) {
        parser = acorn.Parser.extend(
          ...[acornClassFields].concat(options.acornInjectPlugins)
        )
      }
      return {
        acorn,
        acornInjectPlugins: [],
        ...options
      }
    })(),

    async buildStart(options) {
      await Promise.all(
        plugins.map((plugin) => {
          if (plugin.buildStart) {
            plugin.buildStart.call(
              ctx,
              container.options as NormalizedInputOptions
            )
          }
        })
      )
    },

    async resolveId(id, importer, _skip) {
      const key = identifierPair(id, importer)

      const partial: Partial<PartialResolvedId> = {}
      for (const p of plugins) {
        if (!p.resolveId) continue

        if (_skip) {
          if (_skip.includes(p)) continue
          if (resolveSkips.has(p, key)) continue
          resolveSkips.add(p, key)
        }

        plugin = p

        let result
        try {
          result = await p.resolveId.call(ctx, id, importer, {})
        } finally {
          if (_skip) resolveSkips.delete(p, key)
        }

        if (!result) continue
        if (typeof result === 'string') {
          id = result
        } else {
          id = result.id
          Object.assign(partial, result)
        }

        // resolveId() is hookFirst - first non-null result is returned.
        break
      }

      partial.id = id
      return Object.keys(partial).length > 1
        ? (partial as PartialResolvedId)
        : id
    },

    async load(id) {
      for (plugin of plugins) {
        if (!plugin.load) continue
        const result = await plugin.load.call(ctx, id)
        if (result) {
          return result
        }
      }
      return null
    },

    async transform(code, id) {
      for (plugin of plugins) {
        if (!plugin.transform) continue
        // @ts-ignore TODO source map + implement getCombinedSourceMap
        const result = await plugin.transform.call(ctx, code, id)
        if (!result) continue
        if (typeof result === 'object') {
          code = result.code || ''
        } else {
          code = result
        }
      }
      return code
    },

    watchChange(id, event = 'update') {
      if (watchFiles.has(id)) {
        for (plugin of plugins) {
          if (!plugin.watchChange) continue
          plugin.watchChange.call(ctx, id, { event })
        }
      }
    },

    resolveImportMeta(id, property) {
      for (plugin of plugins) {
        if (!plugin.resolveImportMeta) continue
        const result = plugin.resolveImportMeta.call(ctx, property, {
          chunkId: '',
          moduleId: id,
          format: 'es'
        })
        if (result) return result
      }

      // handle file URLs by default
      const matches = property.match(/^ROLLUP_FILE_URL_(\d+)$/)
      if (matches) {
        const referenceId = matches[1]
        const result = container.resolveFileUrl(referenceId)
        if (result) return result
      }
    },

    resolveFileUrl(referenceId) {
      referenceId = String(referenceId)
      const file = files.get(referenceId)
      if (file == null) return null
      const out = resolve(opts.cwd || '.', outputOptions.dir || '.')
      const fileName = relative(out, file.filename)
      const assetInfo = {
        referenceId,
        fileName,
        // @TODO: this should be relative to the module that imported the asset
        relativePath: fileName
      }
      for (plugin of plugins) {
        if (!plugin.resolveFileUrl) continue
        // @ts-ignore
        const result = plugin.resolveFileUrl.call(ctx, assetInfo)
        if (result != null) {
          return result
        }
      }
      return JSON.stringify('/' + fileName.split(sep).join(posix.sep))
    }
  }

  // Tracks recursive resolveId calls
  const resolveSkips = {
    skip: new Map<Plugin, string[]>(),

    has(plugin: Plugin, key: string) {
      const skips = this.skip.get(plugin)
      return skips ? skips.includes(key) : false
    },

    add(plugin: Plugin, key: string) {
      const skips = this.skip.get(plugin)
      if (skips) skips.push(key)
      else this.skip.set(plugin, [key])
    },

    delete(plugin: Plugin, key: string) {
      const skips = this.skip.get(plugin)
      if (!skips) return
      const i = skips.indexOf(key)
      if (i !== -1) popIndex(skips, i)
    }
  }

  return container
}
