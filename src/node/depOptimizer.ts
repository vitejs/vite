import fs from 'fs-extra'
import path from 'path'
import { createHash } from 'crypto'
import { ResolvedConfig } from './config'
import type Rollup from 'rollup'
import type { Plugin } from 'rollup'
import {
  createResolver,
  supportedExts,
  resolveNodeModule,
  InternalResolver
} from './resolver'
import { createBaseRollupPlugins, onRollupWarning } from './build'
import { lookupFile, resolveFrom } from './utils'
import { init, parse } from 'es-module-lexer'
import chalk from 'chalk'
import { Ora } from 'ora'
import { createBuildCssPlugin } from './build/buildPluginCss'
import slash from 'slash'

const debug = require('debug')('vite:optimize')

const KNOWN_IGNORE_LIST = new Set([
  'vite',
  'tailwindcss',
  '@tailwindcss/ui',
  '@pika/react',
  '@pika/react-dom'
])

export interface DepOptimizationOptions {
  /**
   * Only optimize explicitly listed dependencies.
   */
  include?: string[]
  /**
   * Do not optimize these dependencies.
   */
  exclude?: string[]
  /**
   * A list of linked dependencies that should be treated as source code.
   * Use this to list linked packages in a monorepo so that their dependencies
   * are also included for optimization.
   */
  link?: string[]
  /**
   * Automatically run `vite optimize` on server start?
   * @default true
   */
  auto?: boolean
}

export const OPTIMIZE_CACHE_DIR = `node_modules/.vite_opt_cache`

export async function optimizeDeps(
  config: ResolvedConfig & { force?: boolean },
  asCommand = false
) {
  const log = asCommand ? console.log : debug
  const root = config.root || process.cwd()
  // warn presence of web_modules
  if (fs.existsSync(path.join(root, 'web_modules'))) {
    console.warn(
      chalk.yellow(
        `[vite] vite 0.15 has built-in dependency pre-bundling and resolving ` +
          `from web_modules is no longer supported.`
      )
    )
  }

  const pkgPath = lookupFile(root, [`package.json`], true /* pathOnly */)
  if (!pkgPath) {
    log(`package.json not found. Skipping.`)
    return
  }

  const cacheDir = resolveOptimizedCacheDir(root, pkgPath)!
  const hashPath = path.join(cacheDir, 'hash')
  const depHash = getDepHash(root, config.__path)

  if (!config.force) {
    let prevhash
    try {
      prevhash = await fs.readFile(hashPath, 'utf-8')
    } catch (e) {}
    // hash is consistent, no need to re-bundle
    if (prevhash === depHash) {
      log('Hash is consistent. Skipping. Use --force to override.')
      return
    }
  }

  await fs.remove(cacheDir)
  await fs.ensureDir(cacheDir)

  const options = config.optimizeDeps || {}
  const resolver = createResolver(root, config.resolvers, config.alias)

  // Determine deps to optimize. The goal is to only pre-bundle deps that falls
  // under one of the following categories:
  // 1. Has imports to relative files (e.g. lodash-es, lit-html)
  // 2. Has imports to bare modules that are not in the project's own deps
  //    (i.e. esm that imports its own dependencies, e.g. styled-components)
  await init
  const { qualified, external } = filterDeps(root, options, resolver)

  // Resolve deps from linked packages in a monorepo
  if (options.link) {
    options.link.forEach((linkedDep) => {
      const depRoot = path.dirname(
        resolveFrom(root, `${linkedDep}/package.json`)
      )
      const { qualified: q, external: e } = filterDeps(
        depRoot,
        options,
        resolver
      )
      Object.keys(q).forEach((key) => {
        if (!qualified[key]) {
          qualified[key] = q[key]
        }
      })
      e.forEach((id) => {
        if (!external.includes(id)) {
          external.push(id)
        }
      })
    })
  }

  if (!Object.keys(qualified).length) {
    await fs.writeFile(hashPath, depHash)
    log(`No listed dependency requires optimization. Skipping.`)
    return
  }

  if (!asCommand) {
    // This is auto run on server start - let the user know that we are
    // pre-optimizing deps
    console.log(chalk.greenBright(`[vite] Optimizable dependencies detected:`))
    console.log(
      Object.keys(qualified)
        .map((id) => chalk.yellow(id))
        .join(`, `)
    )
  }

  let spinner: Ora | undefined
  const msg = asCommand
    ? `Pre-bundling dependencies to speed up dev server page load...`
    : `Pre-bundling them to speed up dev server page load...\n` +
      `(this will be run only when your dependencies have changed)`
  if (process.env.DEBUG || process.env.NODE_ENV === 'test') {
    console.log(msg)
  } else {
    spinner = require('ora')(msg + '\n').start()
  }

  try {
    const rollup = require('rollup') as typeof Rollup

    // bail early on detection of any usage of node built-ins.
    const isbuiltin = require('isbuiltin')
    const builtinBail: Plugin = {
      name: 'vite:node-built-in-bail',
      resolveId(id, importer) {
        if (isbuiltin(id)) {
          let importingDep
          if (importer) {
            const match = slash(importer).match(
              /\/node_modules\/([^@\/][^\/]*|@[^\/]+\/[^\/]+)\//
            )
            if (match) {
              importingDep = match[1]
            }
          }
          const dep = importingDep
            ? `Dependency "${importingDep}"`
            : `A dependnecy`
          throw new Error(
            `${dep} is attempting to import Node built-in module "${id}". ` +
              `This will not work in a browser environment.`
          )
        }
        return null
      }
    }

    const bundle = await rollup.rollup({
      input: qualified,
      external,
      treeshake: { moduleSideEffects: 'no-external' },
      onwarn: onRollupWarning(spinner),
      ...config.rollupInputOptions,
      plugins: [
        builtinBail,
        ...(await createBaseRollupPlugins(root, resolver, config)),
        createBuildCssPlugin(root, '/', 'assets')
      ]
    })

    const { output } = await bundle.generate({
      ...config.rollupOutputOptions,
      format: 'es',
      exports: 'named',
      entryFileNames: '[name].js',
      chunkFileNames: 'common/[name]-[hash].js'
    })

    spinner && spinner.stop()

    for (const chunk of output) {
      if (chunk.type === 'chunk') {
        const fileName = chunk.fileName
        const filePath = path.join(cacheDir, fileName)
        await fs.ensureDir(path.dirname(filePath))
        await fs.writeFile(filePath, chunk.code)
      }
    }

    await fs.writeFile(hashPath, depHash)
  } catch (e) {
    spinner && spinner.stop()
    if (asCommand) {
      throw e
    } else {
      console.error(chalk.red(`\n[vite] Dep optimization failed with error:`))
      console.error(chalk.red(e.message))
      console.log()
      console.log(
        chalk.yellow(
          `Tip:\nMake sure your "dependencies" only include packages that you\n` +
            `intend to use in the browser. If it's a Node.js package, it\n` +
            `should be in "devDependencies".\n\n` +
            `You can also configure what deps to include/exclude for\n` +
            `optimization using the "optimizeDeps" option in vite.config.js.\n\n` +
            `If you do intend to use this dependency in the browser, then\n` +
            `unfortunately it is not distributed in a web-friendly way and\n` +
            `it is recommended to look for a modern alternative that ships\n` +
            `ES module build.\n`
        )
        // TODO link to docs once we have it
      )
      process.exit(1)
    }
  }
}

interface FilteredDeps {
  // id: entryFilePath
  qualified: Record<string, string>
  external: string[]
}

function filterDeps(
  root: string,
  options: DepOptimizationOptions,
  resolver: InternalResolver
): FilteredDeps {
  const { include, exclude, link } = options
  const pkgContent = lookupFile(root, ['package.json'])
  if (!pkgContent) {
    return {
      qualified: {},
      external: []
    }
  }

  const pkg = JSON.parse(pkgContent)
  const deps = Object.keys(pkg.dependencies || {})
  const qualifiedDeps = deps.filter((id) => {
    if (include && !include.includes(id)) {
      debug(`skipping ${id} (not included)`)
      return false
    }
    if (exclude && exclude.includes(id)) {
      debug(`skipping ${id} (excluded)`)
      return false
    }
    if (link && link.includes(id)) {
      debug(`skipping ${id} (link)`)
      return false
    }
    if (KNOWN_IGNORE_LIST.has(id)) {
      debug(`skipping ${id} (internal excluded)`)
      return false
    }
    const pkgInfo = resolveNodeModule(root, id)
    if (!pkgInfo || !pkgInfo.entryFilePath) {
      debug(`skipping ${id} (cannot resolve entry)`)
      console.log(root, id)
      console.error(
        chalk.yellow(
          `[vite] cannot resolve entry for dependency ${chalk.cyan(id)}.`
        )
      )
      return false
    }
    const { entryFilePath } = pkgInfo
    if (!supportedExts.includes(path.extname(entryFilePath))) {
      debug(`skipping ${id} (entry is not js)`)
      return false
    }
    if (!fs.existsSync(entryFilePath)) {
      debug(`skipping ${id} (entry file does not exist)`)
      console.error(
        chalk.yellow(
          `[vite] dependency ${id} declares non-existent entry file ${entryFilePath}.`
        )
      )
      return false
    }
    const content = fs.readFileSync(entryFilePath, 'utf-8')
    const [imports, exports] = parse(content)
    if (!exports.length && !/export\s+\*\s+from/.test(content)) {
      debug(`optimizing ${id} (no exports, likely commonjs)`)
      return true
    }
    for (const { s, e } of imports) {
      let i = content.slice(s, e).trim()
      i = resolver.alias(i) || i
      if (i.startsWith('.')) {
        debug(`optimizing ${id} (contains relative imports)`)
        return true
      }
      if (!deps.includes(i)) {
        debug(`optimizing ${id} (imports sub dependencies)`)
        return true
      }
    }
    debug(`skipping ${id} (single esm file, doesn't need optimization)`)
  })

  const preservedDeps = deps
    .filter((id) => !qualifiedDeps.includes(id))
    // make sure aliased deps are external
    // https://github.com/vitejs/vite-plugin-react/issues/4
    .map((id) => resolver.alias(id) || id)

  return {
    qualified: qualifiedDeps.reduce((obj, id) => {
      obj[id] = resolveNodeModule(root, id)!.entryFilePath!
      return obj
    }, {} as Record<string, string>),
    external: preservedDeps
  }
}

const lockfileFormats = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']

let cachedHash: string | undefined

export function getDepHash(
  root: string,
  configPath: string | undefined
): string {
  if (cachedHash) {
    return cachedHash
  }
  let content = lookupFile(root, lockfileFormats) || ''
  const pkg = JSON.parse(lookupFile(root, [`package.json`]) || '{}')
  content += JSON.stringify(pkg.dependencies)
  // also take config into account
  if (configPath) {
    content += fs.readFileSync(configPath, 'utf-8')
  }
  return createHash('sha1').update(content).digest('base64')
}

const cacheDirCache = new Map<string, string | null>()

export function resolveOptimizedCacheDir(
  root: string,
  pkgPath?: string
): string | null {
  const cached = cacheDirCache.get(root)
  if (cached !== undefined) return cached
  pkgPath = pkgPath || lookupFile(root, [`package.json`], true /* pathOnly */)
  if (!pkgPath) {
    return null
  }
  const cacheDir = path.join(path.dirname(pkgPath), OPTIMIZE_CACHE_DIR)
  cacheDirCache.set(root, cacheDir)
  return cacheDir
}
