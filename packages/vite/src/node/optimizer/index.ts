import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { createHash } from 'crypto'
import { ResolvedConfig } from '../config'
import {
  createDebugger,
  emptyDir,
  lookupFile,
  normalizePath,
  writeFile
} from '../utils'
import { build } from 'esbuild'
import { esbuildDepPlugin } from './esbuildDepPlugin'
import { init, parse } from 'es-module-lexer'
import { scanImports } from './scan'

const debug = createDebugger('vite:deps')

export interface DepOptimizationOptions {
  /**
   * By default, Vite will crawl your index.html to detect dependencies that
   * need to be pre-bundled. If build.rollupOptions.input is specified, Vite
   * will crawl those entry points instead.
   *
   * If neither of these fit your needs, you can specify custom entries using
   * this option - the value should be a fast-glob pattern or array of patterns
   * (https://github.com/mrmlnc/fast-glob#basic-syntax) that are relative from
   * vite project root. This will overwrite default entries inference.
   */
  entries?: string | string[]
  /**
   * Force optimize listed dependencies (must be resolvalble import paths,
   * cannot be globs).
   */
  include?: string[]
  /**
   * Do not optimize these dependencies (must be resolvable import paths,
   * cannot be globs).
   */
  exclude?: string[]
}

export interface DepOptimizationMetadata {
  hash: string
  optimized: Record<
    string,
    {
      file: string
      src: string
      needsInterop: boolean
    }
  >
}

export async function optimizeDeps(
  config: ResolvedConfig,
  force = config.server.force,
  asCommand = false,
  newDeps?: Record<string, string> // missing imports encountered after server has started
): Promise<DepOptimizationMetadata | null> {
  config = {
    ...config,
    command: 'build'
  }

  const { root, logger, optimizeCacheDir: cacheDir } = config
  const log = asCommand ? logger.info : debug

  if (!cacheDir) {
    log(`No package.json. Skipping.`)
    return null
  }

  const dataPath = path.join(cacheDir, 'metadata.json')
  const data: DepOptimizationMetadata = {
    hash: getDepHash(root, config),
    optimized: {}
  }

  if (!force) {
    let prevData
    try {
      prevData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    } catch (e) {}
    // hash is consistent, no need to re-bundle
    if (prevData && prevData.hash === data.hash) {
      log('Hash is consistent. Skipping. Use --force to override.')
      return prevData
    }
  }

  if (fs.existsSync(cacheDir)) {
    emptyDir(cacheDir)
  } else {
    fs.mkdirSync(cacheDir, { recursive: true })
  }

  let deps: Record<string, string>, missing: Record<string, string>
  if (!newDeps) {
    ;({ deps, missing } = await scanImports(config))
  } else {
    deps = newDeps
    missing = {}
  }

  const missingIds = Object.keys(missing)
  if (missingIds.length) {
    throw new Error(
      `The following dependencies are imported but could not be resolved:\n\n  ${missingIds
        .map(
          (id) =>
            `${chalk.cyan(id)} ${chalk.white.dim(
              `(imported by ${missing[id]})`
            )}`
        )
        .join(`\n  `)}\n\nAre they installed?`
    )
  }

  const qualifiedIds = Object.keys(deps)

  const include = config.optimizeDeps?.include
  if (include) {
    const resolve = config.createResolver({ asSrc: false })
    for (const id of include) {
      if (!deps[id]) {
        const entry = await resolve(id)
        if (entry) {
          deps[id] = entry
        } else {
          throw new Error(
            `Failed to resolve force included dependency: ${chalk.cyan(id)}`
          )
        }
      }
    }
  }

  if (!qualifiedIds.length) {
    writeFile(dataPath, JSON.stringify(data, null, 2))
    log(`No dependencies to bundle. Skipping.\n\n\n`)
    return data
  }

  const depsString = qualifiedIds.map((id) => chalk.yellow(id)).join(`, `)
  if (!asCommand) {
    if (!newDeps) {
      // This is auto run on server start - let the user know that we are
      // pre-optimizing deps
      logger.info(
        chalk.greenBright(`Pre-bundling dependencies:\n${depsString}`)
      )
      logger.info(
        `(this will be run only when your dependencies or config have changed)`
      )
    }
  } else {
    logger.info(chalk.greenBright(`Optimizing dependencies:\n${depsString}`))
  }

  const esbuildMetaPath = path.join(cacheDir, 'esbuild.json')

  await build({
    entryPoints: Object.values(deps).map((p) => path.resolve(p)),
    bundle: true,
    format: 'esm',
    external: config.optimizeDeps?.exclude,
    logLevel: 'error',
    splitting: true,
    sourcemap: true,
    outdir: cacheDir,
    treeShaking: 'ignore-annotations',
    metafile: esbuildMetaPath,
    define: {
      'process.env.NODE_ENV': '"development"'
    },
    plugins: [esbuildDepPlugin(deps, config)]
  })

  const meta = JSON.parse(fs.readFileSync(esbuildMetaPath, 'utf-8'))

  await init
  const entryToIdMap: Record<string, string> = {}
  for (const id in deps) {
    entryToIdMap[deps[id].toLowerCase()] = id
  }

  for (const output in meta.outputs) {
    if (/\.vite[\/\\]chunk\.\w+\.js$/.test(output) || output.endsWith('.map')) {
      continue
    }
    const { inputs, exports } = meta.outputs[output]
    const relativeOutput = normalizePath(
      path.relative(cacheDir, path.resolve(output))
    )
    for (const input in inputs) {
      const entry = normalizePath(path.resolve(input))
      if (!entry.replace(/\.mjs$/, '.js').endsWith(relativeOutput)) {
        continue
      }
      const id = entryToIdMap[entry.toLowerCase()]
      if (!id) {
        continue
      }
      data.optimized[id] = {
        file: normalizePath(path.resolve(output)),
        src: entry,
        needsInterop: needsInterop(id, entry, exports)
      }
      break
    }
  }

  writeFile(dataPath, JSON.stringify(data, null, 2))
  return data
}

// https://github.com/vitejs/vite/issues/1724#issuecomment-767619642
// a list of modules that pretends to be ESM but still uses `require`.
// this causes esbuild to wrap them as CJS even when its entry appears to be ESM.
const KNOWN_INTEROP_IDS = new Set(['moment'])

function needsInterop(
  id: string,
  entry: string,
  generatedExports: string[]
): boolean {
  if (KNOWN_INTEROP_IDS.has(id)) {
    return true
  }
  const [imports, exports] = parse(fs.readFileSync(entry, 'utf-8'))
  // entry has no ESM syntax - likely CJS or UMD
  if (!exports.length && !imports.length) {
    return true
  }
  // if a peer dep used require() on a ESM dep, esbuild turns the
  // ESM dep's entry chunk into a single default export... detect
  // such cases by checking exports mismatch, and force interop.
  if (
    isSingleDefaultExport(generatedExports) &&
    !isSingleDefaultExport(exports)
  ) {
    return true
  }
  return false
}

function isSingleDefaultExport(exports: string[]) {
  return exports.length === 1 && exports[0] === 'default'
}

const lockfileFormats = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']

let cachedHash: string | undefined

function getDepHash(root: string, config: ResolvedConfig): string {
  if (cachedHash) {
    return cachedHash
  }
  let content = lookupFile(root, lockfileFormats) || ''
  // also take config into account
  // only a subset of config options that can affect dep optimization
  content += JSON.stringify(
    {
      mode: config.mode,
      root: config.root,
      alias: config.alias,
      dedupe: config.dedupe,
      assetsInclude: config.assetsInclude,
      optimizeDeps: {
        include: config.optimizeDeps?.include,
        exclude: config.optimizeDeps?.exclude
      }
    },
    (_, value) => {
      if (typeof value === 'function' || value instanceof RegExp) {
        return value.toString()
      }
      return value
    }
  )
  return createHash('sha256').update(content).digest('hex').substr(0, 8)
}
