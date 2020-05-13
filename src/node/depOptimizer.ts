import fs from 'fs-extra'
import path from 'path'
import { createHash } from 'crypto'
import { ResolvedConfig } from './config'
import type Rollup from 'rollup'
import { createResolver, resolveNodeModule } from './resolver'
import { createBaseRollupPlugins } from './build'
import { resolveFrom } from './utils'
import { init, parse } from 'es-module-lexer'
import chalk from 'chalk'

export const OPTIMIZE_CACHE_DIR = `node_modules/.vite_opt_cache`

export interface OptimizeOptions extends ResolvedConfig {
  force?: boolean
}

export async function optimizeDeps(config: OptimizeOptions) {
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
      console.log('Hash is consistent. Skipping. Use --force to override.')
      return
    }
  }

  await fs.remove(cacheDir)
  await fs.ensureDir(cacheDir)

  const pkg = lookupFile(root, [`package.json`])
  if (!pkg) {
    console.log(`package.json not found. Skipping.`)
    return
  }

  const deps = Object.keys(JSON.parse(pkg).dependencies || {})
  if (!deps.length) {
    console.log(`No dependencies listed in package.json. Skipping.`)
    return
  }

  console.log(`Optimizing dependencies...`)

  const resolver = createResolver(root, config.resolvers, config.alias)

  // Determine deps to optimize. The goal is to only pre-bundle deps that falls
  // under one of the following categories:
  // 1. Is CommonJS module
  // 2. Has imports to relative files (e.g. lodash-es, lit-html)
  // 3. Has imports to bare modules that are not in the project's own deps
  //    (i.e. esm that imports its own dependencies, e.g. styled-components)
  await init
  const qualifiedDeps = deps.filter((id) => {
    const entry = resolveNodeModule(root, id)
    if (!entry) {
      return false
    }
    const content = fs.readFileSync(resolveFrom(root, entry), 'utf-8')
    const [imports, exports] = parse(content)
    if (!exports.length) {
      // no exports, likely a commonjs module
      return true
    }
    //
    for (const { s, e } of imports) {
      let i = content.slice(s, e).trim()
      i = resolver.alias(i) || i
      if (i.startsWith('.') || !deps.includes(i)) {
        return true
      }
    }
  })

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

  for (const chunk of output) {
    if (chunk.type === 'chunk') {
      const fileName = chunk.fileName
      const filePath = path.join(cacheDir, fileName)
      await fs.ensureDir(path.dirname(filePath))
      await fs.writeFile(filePath, chunk.code)
      console.log(
        `${fileName.replace(/\.js$/, '')} -> ${path.relative(root, filePath)}`
      )
    }
  }

  await fs.writeFile(hashPath, depHash)
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
  content += lookupFile(root, [`package.json`]) || ''
  // also take config into account
  if (configPath) {
    content += fs.readFileSync(configPath, 'utf-8')
  }
  return createHash('sha1').update(content).digest('base64')
}

function lookupFile(dir: string, formats: string[]): string | undefined {
  for (const format of formats) {
    const fullPath = path.join(dir, format)
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf-8')
    }
  }
  const parentDir = path.dirname(dir)
  if (parentDir !== dir) {
    return lookupFile(parentDir, formats)
  }
}
