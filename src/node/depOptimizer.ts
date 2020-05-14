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

export const OPTIMIZE_CACHE_DIR = `node_modules/.vite_opt_cache`

export interface OptimizeOptions extends ResolvedConfig {
  force?: boolean
}

export async function optimizeDeps(config: OptimizeOptions, asCommand = false) {
  const log = asCommand ? console.log : require('debug')('vite:optimize')
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

  const cacheDir = path.join(root, OPTIMIZE_CACHE_DIR)
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

  const pkg = lookupFile(root, [`package.json`])
  if (!pkg) {
    log(`package.json not found. Skipping.`)
    return
  }

  const deps = Object.keys(JSON.parse(pkg).dependencies || {})
  if (!deps.length) {
    await fs.writeFile(hashPath, depHash)
    log(`No dependencies listed in package.json. Skipping.`)
    return
  }

  const resolver = createResolver(root, config.resolvers, config.alias)

  // Determine deps to optimize. The goal is to only pre-bundle deps that falls
  // under one of the following categories:
  // 1. Is CommonJS module
  // 2. Has imports to relative files (e.g. lodash-es, lit-html)
  // 3. Has imports to bare modules that are not in the project's own deps
  //    (i.e. esm that imports its own dependencies, e.g. styled-components)
  await init
  const qualifiedDeps = deps.filter((id) => {
    const entry = resolveNodeModuleEntry(root, id)
    if (!entry) {
      return false
    }
    if (!supportedExts.includes(path.extname(entry))) {
      return false
    }
    const content = fs.readFileSync(resolveFrom(root, entry), 'utf-8')
    const [imports, exports] = parse(content)
    if (!exports.length) {
      // no exports, likely a commonjs module
      return true
    }
    for (const { s, e } of imports) {
      let i = content.slice(s, e).trim()
      i = resolver.alias(i) || i
      if (i.startsWith('.') || !deps.includes(i)) {
        return true
      }
    }
  })

  if (!qualifiedDeps.length) {
    await fs.writeFile(hashPath, depHash)
    log(`No listed dependency requires optimization. Skipping.`)
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
      `  (this will be run only when your dependencies have changed)`
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
    const bundle = await rollup.rollup({
      input,
      external: preservedDeps,
      treeshake: { moduleSideEffects: 'no-external' },
      onwarn(warning, warn) {
        if (warning.code !== 'CIRCULAR_DEPENDENCY') {
          warn(warning)
        }
      },
      ...config.rollupInputOptions,
      plugins: await createBaseRollupPlugins(root, resolver, config)
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
