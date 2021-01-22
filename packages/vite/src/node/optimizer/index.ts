import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { createHash } from 'crypto'
import { ResolvedConfig } from '../config'
import { SUPPORTED_EXTS } from '../constants'
import {
  createDebugger,
  emptyDir,
  lookupFile,
  normalizePath,
  resolveFrom,
  writeFile
} from '../utils'
import {
  createPluginContainer,
  PluginContainer
} from '../server/pluginContainer'
import { tryNodeResolve } from '../plugins/resolve'
import aliasPlugin from '@rollup/plugin-alias'
import { createFilter, makeLegalIdentifier } from '@rollup/pluginutils'
import { Plugin } from '../plugin'
import { prompt } from 'enquirer'
import { build } from 'esbuild'
import { esbuildDepPlugin } from './esbuildDepPlugin'
import { init, parse } from 'es-module-lexer'

const debug = createDebugger('vite:optimize')

const KNOWN_IGNORE_LIST = new Set([
  'vite',
  'vitepress',
  'tailwindcss',
  '@tailwindcss/ui'
])

const KNOWN_WARN_LIST = new Set([
  'sass',
  'less',
  'stylus',
  'postcss',
  'autoprefixer',
  'pug',
  'jest',
  'typescript'
])

const WARN_RE = /^(@vitejs\/|vite-)plugin-/

export interface DepOptimizationOptions {
  /**
   * Force optimize listed dependencies (supports deep paths).
   */
  include?: string[]
  /**
   * Do not optimize these dependencies.
   */
  exclude?: string | RegExp | (string | RegExp)[]
  /**
   * Plugins to use for dep optimizations.
   */
  plugins?: Plugin[]
  /**
   * Automatically run `vite optimize` on server start?
   * @default true
   */
  auto?: boolean
  /**
   * A list of linked dependencies that should be treated as source code.
   */
  link?: string[]
}

export interface DepOptimizationMetadata {
  hash: string
  optimized: Record<string, string[]>
  transitiveOptimized: Record<string, true>
  dependencies: Record<string, string>
}

export async function optimizeDeps(
  config: ResolvedConfig,
  force = config.server.force,
  asCommand = false
) {
  await init

  config = {
    ...config,
    command: 'build'
  }

  const { root, logger, optimizeCacheDir: cacheDir } = config
  const log = asCommand ? logger.info : debug

  if (!cacheDir) {
    log(`No package.json. Skipping.`)
    return
  }

  const dataPath = path.join(cacheDir, 'metadata.json')
  const pkgPath = lookupFile(root, [`package.json`], true)!
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

  const data: DepOptimizationMetadata = {
    hash: getDepHash(root, pkg, config),
    optimized: {},
    transitiveOptimized: {},
    dependencies: pkg.dependencies
  }

  if (!force) {
    let prevData
    try {
      prevData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    } catch (e) {}
    // hash is consistent, no need to re-bundle
    if (prevData && prevData.hash === data.hash) {
      log('Hash is consistent. Skipping. Use --force to override.')
      return
    }
  }

  if (fs.existsSync(cacheDir)) {
    emptyDir(cacheDir)
  } else {
    fs.mkdirSync(cacheDir, { recursive: true })
  }

  const options = config.optimizeDeps || {}

  // Determine deps to optimize. The goal is to only pre-bundle deps that falls
  // under one of the following categories:
  // 1. Has imports to relative files (e.g. lodash-es, lit-html)
  // 2. Has imports to bare modules that are not in the project's own deps
  //    (i.e. esm that imports its own dependencies, e.g. styled-components)
  // await init
  const aliasResolver = await createPluginContainer({
    ...config,
    plugins: [aliasPlugin({ entries: config.alias })]
  })
  const { qualified, external } = await resolveQualifiedDeps(
    root,
    config,
    aliasResolver
  )

  // Resolve deps from linked packages in a monorepo
  if (options.link) {
    for (const linkedDep of options.link) {
      await resolveLinkedDeps(
        config.root,
        linkedDep,
        qualified,
        external,
        config,
        aliasResolver
      )
    }
  }

  // Force included deps - these can also be deep paths
  if (options.include) {
    for (let id of options.include) {
      const aliased = (await aliasResolver.resolveId(id))?.id || id
      const filePath = tryNodeResolve(aliased, root, config.isProduction)
      if (filePath) {
        qualified[id] = filePath.id
      }
    }
  }

  let qualifiedIds = Object.keys(qualified)
  const invalidIds = qualifiedIds.filter(
    (id) => KNOWN_WARN_LIST.has(id) || WARN_RE.test(id)
  )

  if (invalidIds.length) {
    const { yes } = (await prompt({
      type: 'confirm',
      name: 'yes',
      initial: true,
      message: chalk.yellow(
        `It seems your dependencies contain packages that are not meant to\n` +
          `be used in the browser, e.g. ${chalk.cyan(
            invalidIds.join(', ')
          )}. ` +
          `\nSince vite pre-bundles eligible dependencies to improve performance,\n` +
          `they should probably be moved to devDependencies instead.\n` +
          `Auto-update package.json and continue without these deps?`
      )
    })) as { yes: boolean }
    if (yes) {
      invalidIds.forEach((id) => {
        delete qualified[id]
      })
      qualifiedIds = qualifiedIds.filter((id) => !invalidIds.includes(id))
      const pkgPath = lookupFile(root, ['package.json'], true)!
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
      invalidIds.forEach((id) => {
        const v = pkg.dependencies[id]
        delete pkg.dependencies[id]
        ;(pkg.devDependencies || (pkg.devDependencies = {}))[id] = v
      })
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
      // udpate data hash
      data.hash = getDepHash(root, pkg, config)
    } else {
      process.exit(1)
    }
  }

  if (!qualifiedIds.length) {
    writeFile(dataPath, JSON.stringify(data, null, 2))
    log(`No listed dependency requires optimization. Skipping.\n\n\n`)
    return
  }

  const depsString = qualifiedIds.map((id) => chalk.yellow(id)).join(`, `)
  if (!asCommand) {
    // This is auto run on server start - let the user know that we are
    // pre-optimizing deps
    logger.info(
      chalk.greenBright(`Optimizable dependencies detected:\n${depsString}`)
    )
    logger.info(
      `Pre-bundling them to speed up dev server page load...\n` +
        `(this will be run only when your dependencies or config have changed)`
    )
  } else {
    logger.info(chalk.greenBright(`Optimizing dependencies:\n${depsString}`))
  }

  for (const id in qualified) {
    data.optimized[id] = await parseExports(
      qualified[id],
      config,
      aliasResolver
    )
  }

  // construct a entry containing all the deps
  const tempEntry = buildTempEntry(qualified, data.optimized, cacheDir)
  const tempEntryPath = path.resolve(path.join(cacheDir, 'depsEntry.js'))
  fs.writeFileSync(tempEntryPath, tempEntry)

  await build({
    entryPoints: [tempEntryPath],
    bundle: true,
    format: 'esm',
    outfile: path.join(cacheDir, 'deps.js'),
    define: {
      'process.env.NODE_ENV': '"development"'
    },
    plugins: [esbuildDepPlugin(qualified, config, data.transitiveOptimized)]
  })

  fs.unlinkSync(tempEntryPath)
  writeFile(dataPath, JSON.stringify(data, null, 2))
}

interface FilteredDeps {
  qualified: Record<string, string>
  external: string[]
}

async function resolveQualifiedDeps(
  root: string,
  config: ResolvedConfig,
  aliasResolver: PluginContainer
): Promise<FilteredDeps> {
  const { include, exclude, link } = config.optimizeDeps || {}
  const qualified: Record<string, string> = {}
  const external: string[] = []

  const pkgContent = lookupFile(root, ['package.json'])
  if (!pkgContent) {
    return {
      qualified,
      external
    }
  }

  const pkg = JSON.parse(pkgContent)
  const deps = Object.keys(pkg.dependencies || {})
  const linked: string[] = []
  const excludeFilter =
    exclude && createFilter(null, exclude, { resolve: false })

  for (const id of deps) {
    if (include && include.includes(id)) {
      // already force included
      continue
    }
    if (excludeFilter && !excludeFilter(id)) {
      debug(`skipping ${id} (excluded)`)
      continue
    }
    if (link && link.includes(id)) {
      debug(`skipping ${id} (link)`)
      continue
    }
    if (KNOWN_IGNORE_LIST.has(id)) {
      debug(`skipping ${id} (internal excluded)`)
      continue
    }
    // #804
    if (id.startsWith('@types/')) {
      debug(`skipping ${id} (ts declaration)`)
      continue
    }
    let filePath
    try {
      const aliased = (await aliasResolver.resolveId(id))?.id || id
      const resolved = tryNodeResolve(aliased, root, config.isProduction)
      filePath = resolved && resolved.id
    } catch (e) {}
    if (!filePath) {
      debug(`skipping ${id} (cannot resolve entry)`)
      continue
    }
    if (!filePath.includes('node_modules')) {
      debug(`skipping ${id} (not a node_modules dep, likely linked)`)
      // resolve deps of the linked module
      linked.push(id)
      continue
    }
    if (!SUPPORTED_EXTS.includes(path.extname(filePath))) {
      debug(`skipping ${id} (entry is not js)`)
      continue
    }
    // qualified!
    qualified[id] = filePath
  }

  // mark non-optimized deps as external
  external.push(
    ...(await Promise.all(
      deps
        .filter((id) => !qualified[id])
        // make sure aliased deps are external
        // https://github.com/vitejs/vite-plugin-react/issues/4
        .map(async (id) => (await aliasResolver.resolveId(id))?.id || id)
    ))
  )

  if (linked.length) {
    for (const dep of linked) {
      await resolveLinkedDeps(
        root,
        dep,
        qualified,
        external,
        config,
        aliasResolver
      )
    }
  }

  return {
    qualified,
    external
  }
}

async function resolveLinkedDeps(
  root: string,
  dep: string,
  qualified: Record<string, string>,
  external: string[],
  config: ResolvedConfig,
  aliasResolver: PluginContainer
) {
  const depRoot = path.dirname(resolveFrom(`${dep}/package.json`, root))
  const { qualified: q, external: e } = await resolveQualifiedDeps(
    depRoot,
    config,
    aliasResolver
  )
  Object.keys(q).forEach((id) => {
    if (!qualified[id]) {
      qualified[id] = q[id]
    }
  })
  e.forEach((id) => {
    if (!external.includes(id)) {
      external.push(id)
    }
  })
}

const lockfileFormats = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']

let cachedHash: string | undefined

function getDepHash(
  root: string,
  pkg: Record<string, any>,
  config: ResolvedConfig
): string {
  if (cachedHash) {
    return cachedHash
  }
  let content = lookupFile(root, lockfileFormats) || ''
  content += JSON.stringify(pkg.dependencies)
  // also take config into account
  // only a subset of config options that can affect dep optimization
  content += JSON.stringify(
    {
      mode: config.mode,
      root: config.root,
      alias: config.alias,
      dedupe: config.dedupe,
      assetsInclude: config.assetsInclude,
      build: {
        commonjsOptions: config.build.commonjsOptions,
        rollupOptions: {
          external: config.build.rollupOptions?.external
        }
      },
      optimizeDeps: {
        include: config.optimizeDeps?.include,
        exclude: config.optimizeDeps?.exclude,
        plugins: config.optimizeDeps?.plugins?.map((p) => p.name),
        link: config.optimizeDeps?.link
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

function buildTempEntry(
  qualified: Record<string, string>,
  idToExports: DepOptimizationMetadata['optimized'],
  basedir: string
) {
  let res = ''
  for (const id in qualified) {
    const validId = makeLegalIdentifier(id)
    const exports = idToExports[id]
    const entry = normalizePath(path.relative(basedir, qualified[id]))
    if (!exports.length) {
      // cjs or umd - provide rollup-style compat
      // by exposing both the default and named properties
      res += `import ${validId}_default from "${entry}"\n`
      res += `import * as ${validId}_all from "${entry}"\n`
      res += `const ${validId} = { ...${validId}_all, default: ${validId}_default }\n`
      res += `export { ${validId} }\n`
    } else {
      res += `export { ${exports
        .map((e) => `${e} as ${validId}_${e}`)
        .join(', ')} } from "${entry}"\n`
    }
  }
  return res
}

async function parseExports(
  entry: string,
  config: ResolvedConfig,
  aliasResolver: PluginContainer
) {
  const content = fs.readFileSync(entry, 'utf-8')
  const [imports, exports] = parse(content)

  // check for export * from statements
  for (const {
    s: start,
    e: end,
    ss: expStart,
    se: expEnd,
    d: dynamicIndex
  } of imports) {
    if (dynamicIndex < 0) {
      const exp = content.slice(expStart, expEnd)
      if (exp.startsWith(`export * from`)) {
        const id = content.slice(start, end)
        const aliased = (await aliasResolver.resolveId(id))?.id || id
        const filePath = tryNodeResolve(
          aliased,
          config.root,
          config.isProduction
        )?.id
        if (filePath) {
          const childExports = await parseExports(
            filePath,
            config,
            aliasResolver
          )
          exports.push(...childExports)
        }
      }
    }
  }
  return exports
}
