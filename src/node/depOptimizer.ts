import fs from 'fs-extra'
import path from 'path'
import { createHash } from 'crypto'
import { ResolvedConfig } from './config'
import type Rollup from 'rollup'
import {
  createResolver,
  supportedExts,
  resolveNodeModuleEntry
} from './resolver'
import { createBaseRollupPlugins } from './build'
import { resolveFrom, lookupFile } from './utils'
import { init, parse } from 'es-module-lexer'
import chalk from 'chalk'
import { Ora } from 'ora'
import { createBuildCssPlugin } from './build/buildPluginCss'

const KNOWN_IGNORE_LIST = new Set([
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
   * Explicitly allow these CommonJS deps to be bundled.
   */
  commonJSWhitelist?: string[]
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
  const debug = require('debug')('vite:optimize')
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

  const cacheDir = path.join(path.dirname(pkgPath), OPTIMIZE_CACHE_DIR)
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

  const deps = Object.keys(require(pkgPath).dependencies || {})
  if (!deps.length) {
    await fs.writeFile(hashPath, depHash)
    log(`No dependencies listed in package.json. Skipping.`)
    return
  }

  const resolver = createResolver(root, config.resolvers, config.alias)
  const { include, exclude, commonJSWhitelist } = config.optimizeDeps || {}

  // Determine deps to optimize. The goal is to only pre-bundle deps that falls
  // under one of the following categories:
  // 1. Has imports to relative files (e.g. lodash-es, lit-html)
  // 2. Has imports to bare modules that are not in the project's own deps
  //    (i.e. esm that imports its own dependencies, e.g. styled-components)
  await init
  const cjsDeps: string[] = []
  const qualifiedDeps = deps.filter((id) => {
    if (include && !include.includes(id)) {
      debug(`skipping ${id} (not included)`)
      return false
    }
    if (exclude && exclude.includes(id)) {
      debug(`skipping ${id} (excluded)`)
      return false
    }
    if (commonJSWhitelist && commonJSWhitelist.includes(id)) {
      debug(`optimizing ${id} (commonJSWhitelist)`)
      return true
    }
    if (KNOWN_IGNORE_LIST.has(id)) {
      debug(`skipping ${id} (internal excluded)`)
      return false
    }
    const pkgInfo = resolveNodeModuleEntry(root, id)
    if (!pkgInfo) {
      debug(`skipping ${id} (cannot resolve entry)`)
      return false
    }
    const [entry, pkg] = pkgInfo
    if (!supportedExts.includes(path.extname(entry))) {
      debug(`skipping ${id} (entry is not js)`)
      return false
    }
    const content = fs.readFileSync(resolveFrom(root, entry), 'utf-8')
    const [imports, exports] = parse(content)
    if (!exports.length && !/export\s+\*\s+from/.test(content)) {
      if (!pkg.module) {
        cjsDeps.push(id)
      }
      debug(`skipping ${id} (no exports, likely commonjs)`)
      return false
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

  if (!qualifiedDeps.length) {
    if (!cjsDeps.length) {
      await fs.writeFile(hashPath, depHash)
      log(`No listed dependency requires optimization. Skipping.`)
    } else {
      console.error(
        chalk.yellow(
          `[vite] The following dependencies seem to be CommonJS modules that\n` +
            `do not provide ESM-friendly file formats:\n\n  ` +
            cjsDeps.map((dep) => chalk.magenta(dep)).join(`\n  `) +
            `\n` +
            `\n- If you are not using them in browser code, you can move them\n` +
            `to devDependencies or exclude them from this check by adding\n` +
            `them to ${chalk.cyan(
              `optimizeDeps.exclude`
            )} in vue.config.js.\n` +
            `\n- If you do intend to use them in the browser, you can try adding\n` +
            `them to ${chalk.cyan(
              `optimizeDeps.commonJSWhitelist`
            )} in vue.config.js but they\n` +
            `may fail to bundle or work properly. Consider choosing more modern\n` +
            `alternatives that provide ES module build formts.`
        )
      )
    }
    return
  }

  if (!asCommand) {
    // This is auto run on server start - let the user know that we are
    // pre-optimizing deps
    console.log(chalk.greenBright(`[vite] Optimizable dependencies detected.`))
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
    // Non qualified deps are marked as externals, since they will be preserved
    // and resolved from their original node_modules locations.
    const preservedDeps = deps.filter((id) => !qualifiedDeps.includes(id))

    const input = qualifiedDeps.reduce((entries, name) => {
      entries[name] = name
      return entries
    }, {} as Record<string, string>)

    const rollup = require('rollup') as typeof Rollup
    const warningIgnoreList = [`CIRCULAR_DEPENDENCY`, `THIS_IS_UNDEFINED`]
    const bundle = await rollup.rollup({
      input,
      external: preservedDeps,
      treeshake: { moduleSideEffects: 'no-external' },
      onwarn(warning, warn) {
        if (!warningIgnoreList.includes(warning.code!)) {
          warn(warning)
        }
      },
      ...config.rollupInputOptions,
      plugins: [
        ...(await createBaseRollupPlugins(root, resolver, config)),
        createBuildCssPlugin(root, '/', 'assets')
      ]
    })

    const { output } = await bundle.generate({
      ...config.rollupOutputOptions,
      format: 'es',
      exports: 'named',
      chunkFileNames: 'common/[name]-[hash].js'
    })

    spinner && spinner.stop()

    const optimized = []
    for (const chunk of output) {
      if (chunk.type === 'chunk') {
        const fileName = chunk.fileName
        const filePath = path.join(cacheDir, fileName)
        await fs.ensureDir(path.dirname(filePath))
        await fs.writeFile(filePath, chunk.code)
        if (!fileName.startsWith('common/')) {
          optimized.push(fileName.replace(/\.js$/, ''))
        }
      }
    }

    console.log(
      `Optimized modules:\n${optimized
        .map((id) => chalk.yellowBright(id))
        .join(`, `)}`
    )

    await fs.writeFile(hashPath, depHash)
  } catch (e) {
    spinner && spinner.stop()
    if (asCommand) {
      throw e
    } else {
      console.error(chalk.red(`[vite] Dep optimization failed with error:`))
      console.error(e)
      console.log()
      console.log(
        chalk.yellow(
          `Tip: You can configure what deps to include/exclude for optimization\n` +
            `using the \`optimizeDeps\` option in the Vite config file.`
        )
      )
    }
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
