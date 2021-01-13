import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import Rollup from 'rollup'
import { createHash } from 'crypto'
import { ResolvedConfig, sortUserPlugins } from '../config'
import { SUPPORTED_EXTS } from '../constants'
import { init, parse } from 'es-module-lexer'
import { onRollupWarning } from '../build'
import {
  createDebugger,
  emptyDir,
  lookupFile,
  resolveFrom,
  writeFile
} from '../utils'
import { depAssetExternalPlugin, depAssetRewritePlugin } from './depAssetPlugin'
import { recordCjsEntryPlugin } from './depMetadataPlugin'
import {
  createPluginContainer,
  PluginContainer
} from '../server/pluginContainer'
import { resolvePlugin, tryNodeResolve } from '../plugins/resolve'
import aliasPlugin from '@rollup/plugin-alias'
import commonjsPlugin from '@rollup/plugin-commonjs'
import jsonPlugin from '@rollup/plugin-json'
import { buildDefinePlugin } from '../plugins/define'
import { createFilter } from '@rollup/pluginutils'
import { Plugin } from '../plugin'
import { prompt } from 'enquirer'

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
   * @deprecated local linked deps are auto detected in Vite 2.
   */
  link?: string[]
}

export interface DepOptimizationMetadata {
  hash: string
  map: Record<string, string>
  cjsEntries: Record<string, true>
}

export async function optimizeDeps(
  config: ResolvedConfig,
  force = config.server.force,
  asCommand = false
) {
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
  const data: DepOptimizationMetadata = {
    hash: getDepHash(root, config.mode, config.configFile),
    map: {},
    cjsEntries: {}
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
  await init
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
    options.include.forEach((id) => {
      const filePath = tryNodeResolve(id, root, config.isProduction)
      if (filePath) {
        qualified[id] = filePath.id
      }
    })
  }

  const qualifiedIds = Object.keys(qualified)
  if (!qualifiedIds.length) {
    writeFile(dataPath, JSON.stringify(data, null, 2))
    log(`No listed dependency requires optimization. Skipping.`)
    return
  }

  const invalid = qualifiedIds.filter(
    (id) => KNOWN_WARN_LIST.has(id) || WARN_RE.test(id)
  )
  if (invalid.length) {
    const { yes } = (await prompt({
      type: 'confirm',
      name: 'yes',
      initial: false,
      message: chalk.yellow(
        `It seems your dependencies contain packages that are not meant to\n` +
          `be used in the browser, e.g. ${chalk.cyan(invalid.join(', '))}. ` +
          `\nSince vite pre-bundles eligible dependencies to improve performance,\n` +
          `they should probably be moved to devDepndencies instead.\n` +
          `Continue anyway?`
      )
    })) as { yes: boolean }
    if (!yes) {
      process.exit(0)
    }
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

  const [pre, normal, post] = sortUserPlugins(options.plugins)

  try {
    const rollup = require('rollup') as typeof Rollup
    const bundle = await rollup.rollup({
      input: qualified,
      external,
      onwarn(warning, warn) {
        onRollupWarning(warning, warn, config)
      },
      plugins: [
        aliasPlugin({ entries: config.alias }),
        ...pre,
        depAssetExternalPlugin(config),
        resolvePlugin(
          {
            root: config.root,
            dedupe: config.dedupe,
            isBuild: true,
            asSrc: false
          },
          config
        ),
        jsonPlugin({
          preferConst: true,
          namedExports: true
        }),
        ...normal,
        commonjsPlugin(config.build.commonjsOptions),
        buildDefinePlugin(config),
        depAssetRewritePlugin(config),
        recordCjsEntryPlugin(data),
        ...post
      ]
    })

    const { output } = await bundle.generate({
      format: 'es',
      exports: 'named',
      entryFileNames: '[name].[hash].js',
      chunkFileNames: 'common/[name].[hash].js'
    })

    for (const chunk of output) {
      if (chunk.type === 'chunk') {
        writeFile(path.join(cacheDir, chunk.fileName), chunk.code)
      }
    }
    writeFile(dataPath, JSON.stringify(data, null, 2))
  } catch (e) {
    delete e.watchFiles
    logger.error(chalk.red(`\nDep optimization failed with error:`))
    if (e.code === 'PARSE_ERROR') {
      e.message += `\n\n${chalk.cyan(
        path.relative(root, e.loc.file)
      )}\n${chalk.dim(e.frame)}`
    }
    throw e
  }
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
    exclude && createFilter(exclude, null, { resolve: false })

  for (const id of deps) {
    if (include && include.includes(id)) {
      // already force included
      continue
    }
    if (excludeFilter && excludeFilter(id)) {
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
      const resolved = tryNodeResolve(id, root, config.isProduction)
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
    const content = fs.readFileSync(filePath, 'utf-8')
    const [imports, exports] = parse(content)
    if (!exports.length && !/export\s+\*\s+from/.test(content)) {
      debug(`optimizing ${id} (no exports, likely commonjs)`)
      qualified[id] = filePath
      continue
    }
    for (const { s, e } of imports) {
      let i = content.slice(s, e).trim()
      i = (await aliasResolver.resolveId(i))?.id || i
      if (i.startsWith('.')) {
        debug(`optimizing ${id} (contains relative imports)`)
        qualified[id] = filePath
        break
      }
      if (!deps.includes(i)) {
        debug(`optimizing ${id} (imports sub dependencies)`)
        qualified[id] = filePath
        break
      }
    }
    debug(`skipping ${id} (single esm file, doesn't need optimization)`)
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

export function getDepHash(
  root: string,
  mode: string,
  configFile: string | undefined
): string {
  if (cachedHash) {
    return cachedHash
  }
  let content = mode + (lookupFile(root, lockfileFormats) || '')
  const pkg = JSON.parse(lookupFile(root, [`package.json`]) || '{}')
  content += JSON.stringify(pkg.dependencies)
  // also take config into account
  if (configFile) {
    content += fs.readFileSync(configFile, 'utf-8')
  }
  return createHash('sha256').update(content).digest('hex').substr(0, 8)
}
