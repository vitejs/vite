import fsp from 'node:fs/promises'
import path from 'node:path'
import type { Server } from 'node:http'
import colors from 'picocolors'
import type { Update } from 'types/hmrPayload'
import type { RollupError } from 'rollup'
import { CLIENT_DIR } from '../constants'
import {
  createDebugger,
  normalizePath,
  unique,
  withTrailingSlash,
  wrapId,
} from '../utils'
import type { ViteDevServer } from '..'
import { isCSSRequest } from '../plugins/css'
import { getAffectedGlobModules } from '../plugins/importMetaGlob'
import { isExplicitImportRequired } from '../plugins/importAnalysis'
import { getEnvFilesForMode } from '../env'
import type { ModuleNode } from './moduleGraph'
import { restartServerWithUrls } from '.'

export const debugHmr = createDebugger('vite:hmr')

const whitespaceRE = /\s/

const normalizedClientDir = normalizePath(CLIENT_DIR)

export interface HmrOptions {
  protocol?: string
  host?: string
  port?: number
  clientPort?: number
  path?: string
  timeout?: number
  overlay?: boolean
  server?: Server
}

export interface HmrContext {
  file: string
  timestamp: number
  modules: Array<ModuleNode>
  read: () => string | Promise<string>
  server: ViteDevServer
}

export function getShortName(file: string, root: string): string {
  return file.startsWith(withTrailingSlash(root))
    ? path.posix.relative(root, file)
    : file
}

export async function handleHMRUpdate(
  file: string,
  server: ViteDevServer,
  configOnly: boolean,
): Promise<void> {
  const { ws, config, moduleGraph } = server
  const shortFile = getShortName(file, config.root)
  const fileName = path.basename(file)

  const isConfig = file === config.configFile
  const isConfigDependency = config.configFileDependencies.some(
    (name) => file === name,
  )

  const isEnv =
    config.inlineConfig.envFile !== false &&
    getEnvFilesForMode(config.mode).includes(fileName)
  if (isConfig || isConfigDependency || isEnv) {
    // auto restart server
    debugHmr?.(`[config change] ${colors.dim(shortFile)}`)
    config.logger.info(
      colors.green(
        `${path.relative(process.cwd(), file)} changed, restarting server...`,
      ),
      { clear: true, timestamp: true },
    )
    try {
      await restartServerWithUrls(server)
    } catch (e) {
      config.logger.error(colors.red(e))
    }
    return
  }

  if (configOnly) {
    return
  }

  debugHmr?.(`[file change] ${colors.dim(shortFile)}`)

  // (dev only) the client itself cannot be hot updated.
  if (file.startsWith(withTrailingSlash(normalizedClientDir))) {
    ws.send({
      type: 'full-reload',
      path: '*',
    })
    return
  }

  const mods = moduleGraph.getModulesByFile(file)

  // check if any plugin wants to perform custom HMR handling
  const timestamp = Date.now()
  const hmrContext: HmrContext = {
    file,
    timestamp,
    modules: mods ? [...mods] : [],
    read: () => readModifiedFile(file),
    server,
  }

  for (const hook of config.getSortedPluginHooks('handleHotUpdate')) {
    const filteredModules = await hook(hmrContext)
    if (filteredModules) {
      hmrContext.modules = filteredModules
    }
  }

  if (!hmrContext.modules.length) {
    // html file cannot be hot updated
    if (file.endsWith('.html')) {
      config.logger.info(colors.green(`page reload `) + colors.dim(shortFile), {
        clear: true,
        timestamp: true,
      })
      ws.send({
        type: 'full-reload',
        path: config.server.middlewareMode
          ? '*'
          : '/' + normalizePath(path.relative(config.root, file)),
      })
    } else {
      // loaded but not in the module graph, probably not js
      debugHmr?.(`[no modules matched] ${colors.dim(shortFile)}`)
    }
    return
  }

  updateModules(shortFile, hmrContext.modules, timestamp, server)
}

type HasDeadEnd = boolean | string
export function updateModules(
  file: string,
  modules: ModuleNode[],
  timestamp: number,
  { config, ws, moduleGraph }: ViteDevServer,
  afterInvalidation?: boolean,
): void {
  const updates: Update[] = []
  const invalidatedModules = new Set<ModuleNode>()
  const traversedModules = new Set<ModuleNode>()
  let needFullReload: HasDeadEnd = false

  for (const mod of modules) {
    const boundaries: { boundary: ModuleNode; acceptedVia: ModuleNode }[] = []
    const hasDeadEnd = propagateUpdate(mod, traversedModules, boundaries)

    moduleGraph.invalidateModule(mod, invalidatedModules, timestamp, true)

    if (needFullReload) {
      continue
    }

    if (hasDeadEnd) {
      needFullReload = hasDeadEnd
      continue
    }

    updates.push(
      ...boundaries.map(({ boundary, acceptedVia }) => ({
        type: `${boundary.type}-update` as const,
        timestamp,
        path: normalizeHmrUrl(boundary.url),
        explicitImportRequired:
          boundary.type === 'js'
            ? isExplicitImportRequired(acceptedVia.url)
            : undefined,
        acceptedPath: normalizeHmrUrl(acceptedVia.url),
      })),
    )
  }

  if (needFullReload) {
    const reason =
      typeof needFullReload === 'string'
        ? colors.dim(` (${needFullReload})`)
        : ''
    config.logger.info(
      colors.green(`page reload `) + colors.dim(file) + reason,
      { clear: !afterInvalidation, timestamp: true },
    )
    ws.send({
      type: 'full-reload',
    })
    return
  }

  if (updates.length === 0) {
    debugHmr?.(colors.yellow(`no update happened `) + colors.dim(file))
    return
  }

  config.logger.info(
    colors.green(`hmr update `) +
      colors.dim([...new Set(updates.map((u) => u.path))].join(', ')),
    { clear: !afterInvalidation, timestamp: true },
  )
  ws.send({
    type: 'update',
    updates,
  })
}

export async function handleFileAddUnlink(
  file: string,
  server: ViteDevServer,
  isUnlink: boolean,
): Promise<void> {
  const modules = [...(server.moduleGraph.getModulesByFile(file) || [])]

  if (isUnlink) {
    for (const deletedMod of modules) {
      deletedMod.importedModules.forEach((importedMod) => {
        importedMod.importers.delete(deletedMod)
      })
    }
  }

  modules.push(...getAffectedGlobModules(file, server))

  if (modules.length > 0) {
    updateModules(
      getShortName(file, server.config.root),
      unique(modules),
      Date.now(),
      server,
    )
  }
}

function areAllImportsAccepted(
  importedBindings: Set<string>,
  acceptedExports: Set<string>,
) {
  for (const binding of importedBindings) {
    if (!acceptedExports.has(binding)) {
      return false
    }
  }
  return true
}

function propagateUpdate(
  node: ModuleNode,
  traversedModules: Set<ModuleNode>,
  boundaries: { boundary: ModuleNode; acceptedVia: ModuleNode }[],
  currentChain: ModuleNode[] = [node],
): HasDeadEnd {
  if (traversedModules.has(node)) {
    return false
  }
  traversedModules.add(node)

  // #7561
  // if the imports of `node` have not been analyzed, then `node` has not
  // been loaded in the browser and we should stop propagation.
  if (node.id && node.isSelfAccepting === undefined) {
    debugHmr?.(
      `[propagate update] stop propagation because not analyzed: ${colors.dim(
        node.id,
      )}`,
    )
    return false
  }

  if (node.isSelfAccepting) {
    boundaries.push({ boundary: node, acceptedVia: node })
    const result = isNodeWithinCircularImports(node, currentChain)
    if (result) return result

    // additionally check for CSS importers, since a PostCSS plugin like
    // Tailwind JIT may register any file as a dependency to a CSS file.
    for (const importer of node.importers) {
      if (isCSSRequest(importer.url) && !currentChain.includes(importer)) {
        propagateUpdate(
          importer,
          traversedModules,
          boundaries,
          currentChain.concat(importer),
        )
      }
    }

    return false
  }

  // A partially accepted module with no importers is considered self accepting,
  // because the deal is "there are parts of myself I can't self accept if they
  // are used outside of me".
  // Also, the imported module (this one) must be updated before the importers,
  // so that they do get the fresh imported module when/if they are reloaded.
  if (node.acceptedHmrExports) {
    boundaries.push({ boundary: node, acceptedVia: node })
    const result = isNodeWithinCircularImports(node, currentChain)
    if (result) return result
  } else {
    if (!node.importers.size) {
      return true
    }

    // #3716, #3913
    // For a non-CSS file, if all of its importers are CSS files (registered via
    // PostCSS plugins) it should be considered a dead end and force full reload.
    if (
      !isCSSRequest(node.url) &&
      [...node.importers].every((i) => isCSSRequest(i.url))
    ) {
      return true
    }
  }

  for (const importer of node.importers) {
    const subChain = currentChain.concat(importer)

    if (importer.acceptedHmrDeps.has(node)) {
      boundaries.push({ boundary: importer, acceptedVia: node })
      const result = isNodeWithinCircularImports(importer, subChain)
      if (result) return result
      continue
    }

    if (node.id && node.acceptedHmrExports && importer.importedBindings) {
      const importedBindingsFromNode = importer.importedBindings.get(node.id)
      if (
        importedBindingsFromNode &&
        areAllImportsAccepted(importedBindingsFromNode, node.acceptedHmrExports)
      ) {
        continue
      }
    }

    if (
      !currentChain.includes(importer) &&
      propagateUpdate(importer, traversedModules, boundaries, subChain)
    ) {
      return true
    }
  }
  return false
}

/**
 * Check importers recursively if it's an import loop. An accepted module within
 * an import loop cannot recover its execution order and should be reloaded.
 *
 * @param node The node that accepts HMR and is a boundary
 * @param nodeChain The chain of nodes/imports that lead to the node.
 *   (The last node in the chain imports the `node` parameter)
 * @param currentChain The current chain tracked from the `node` parameter
 * @param traversedModules The set of modules that have traversed
 */
function isNodeWithinCircularImports(
  node: ModuleNode,
  nodeChain: ModuleNode[],
  currentChain: ModuleNode[] = [node],
  traversedModules = new Set<ModuleNode>(),
): HasDeadEnd {
  // To help visualize how each parameters work, imagine this import graph:
  //
  // A -> B -> C -> ACCEPTED -> D -> E -> NODE
  //      ^--------------------------|
  //
  // ACCEPTED: the node that accepts HMR. the `node` parameter.
  // NODE    : the initial node that triggered this HMR.
  //
  // This function will return true in the above graph, which:
  // `node`         : ACCEPTED
  // `nodeChain`    : [NODE, E, D, ACCEPTED]
  // `currentChain` : [ACCEPTED, C, B]
  //
  // It works by checking if any `node` importers are within `nodeChain`, which
  // means there's an import loop with a HMR-accepted module in it.

  if (traversedModules.has(node)) {
    return false
  }
  traversedModules.add(node)

  for (const importer of node.importers) {
    // Node may import itself which is safe
    if (importer === node) continue

    // Check circular imports
    const importerIndex = nodeChain.indexOf(importer)
    if (importerIndex > -1) {
      // Log extra debug information so users can fix and remove the circular imports
      if (debugHmr) {
        // Following explanation above:
        // `importer`                    : E
        // `currentChain` reversed       : [B, C, ACCEPTED]
        // `nodeChain` sliced & reversed : [D, E]
        // Combined                      : [E, B, C, ACCEPTED, D, E]
        const importChain = [
          importer,
          ...[...currentChain].reverse(),
          ...nodeChain.slice(importerIndex, -1).reverse(),
        ]
        debugHmr(
          colors.yellow(`circular imports detected: `) +
            importChain.map((m) => colors.dim(m.url)).join(' -> '),
        )
      }
      return 'circular imports'
    }

    // Continue recursively
    if (!currentChain.includes(importer)) {
      const result = isNodeWithinCircularImports(
        importer,
        nodeChain,
        currentChain.concat(importer),
        traversedModules,
      )
      if (result) return result
    }
  }
  return false
}

export function handlePrunedModules(
  mods: Set<ModuleNode>,
  { ws }: ViteDevServer,
): void {
  // update the disposed modules' hmr timestamp
  // since if it's re-imported, it should re-apply side effects
  // and without the timestamp the browser will not re-import it!
  const t = Date.now()
  mods.forEach((mod) => {
    mod.lastHMRTimestamp = t
    debugHmr?.(`[dispose] ${colors.dim(mod.file)}`)
  })
  ws.send({
    type: 'prune',
    paths: [...mods].map((m) => m.url),
  })
}

const enum LexerState {
  inCall,
  inSingleQuoteString,
  inDoubleQuoteString,
  inTemplateString,
  inArray,
}

/**
 * Lex import.meta.hot.accept() for accepted deps.
 * Since hot.accept() can only accept string literals or array of string
 * literals, we don't really need a heavy @babel/parse call on the entire source.
 *
 * @returns selfAccepts
 */
export function lexAcceptedHmrDeps(
  code: string,
  start: number,
  urls: Set<{ url: string; start: number; end: number }>,
): boolean {
  let state: LexerState = LexerState.inCall
  // the state can only be 2 levels deep so no need for a stack
  let prevState: LexerState = LexerState.inCall
  let currentDep: string = ''

  function addDep(index: number) {
    urls.add({
      url: currentDep,
      start: index - currentDep.length - 1,
      end: index + 1,
    })
    currentDep = ''
  }

  for (let i = start; i < code.length; i++) {
    const char = code.charAt(i)
    switch (state) {
      case LexerState.inCall:
      case LexerState.inArray:
        if (char === `'`) {
          prevState = state
          state = LexerState.inSingleQuoteString
        } else if (char === `"`) {
          prevState = state
          state = LexerState.inDoubleQuoteString
        } else if (char === '`') {
          prevState = state
          state = LexerState.inTemplateString
        } else if (whitespaceRE.test(char)) {
          continue
        } else {
          if (state === LexerState.inCall) {
            if (char === `[`) {
              state = LexerState.inArray
            } else {
              // reaching here means the first arg is neither a string literal
              // nor an Array literal (direct callback) or there is no arg
              // in both case this indicates a self-accepting module
              return true // done
            }
          } else if (state === LexerState.inArray) {
            if (char === `]`) {
              return false // done
            } else if (char === ',') {
              continue
            } else {
              error(i)
            }
          }
        }
        break
      case LexerState.inSingleQuoteString:
        if (char === `'`) {
          addDep(i)
          if (prevState === LexerState.inCall) {
            // accept('foo', ...)
            return false
          } else {
            state = prevState
          }
        } else {
          currentDep += char
        }
        break
      case LexerState.inDoubleQuoteString:
        if (char === `"`) {
          addDep(i)
          if (prevState === LexerState.inCall) {
            // accept('foo', ...)
            return false
          } else {
            state = prevState
          }
        } else {
          currentDep += char
        }
        break
      case LexerState.inTemplateString:
        if (char === '`') {
          addDep(i)
          if (prevState === LexerState.inCall) {
            // accept('foo', ...)
            return false
          } else {
            state = prevState
          }
        } else if (char === '$' && code.charAt(i + 1) === '{') {
          error(i)
        } else {
          currentDep += char
        }
        break
      default:
        throw new Error('unknown import.meta.hot lexer state')
    }
  }
  return false
}

export function lexAcceptedHmrExports(
  code: string,
  start: number,
  exportNames: Set<string>,
): boolean {
  const urls = new Set<{ url: string; start: number; end: number }>()
  lexAcceptedHmrDeps(code, start, urls)
  for (const { url } of urls) {
    exportNames.add(url)
  }
  return urls.size > 0
}

export function normalizeHmrUrl(url: string): string {
  if (url[0] !== '.' && url[0] !== '/') {
    url = wrapId(url)
  }
  return url
}

function error(pos: number) {
  const err = new Error(
    `import.meta.hot.accept() can only accept string literals or an ` +
      `Array of string literals.`,
  ) as RollupError
  err.pos = pos
  throw err
}

// vitejs/vite#610 when hot-reloading Vue files, we read immediately on file
// change event and sometimes this can be too early and get an empty buffer.
// Poll until the file's modified time has changed before reading again.
async function readModifiedFile(file: string): Promise<string> {
  const content = await fsp.readFile(file, 'utf-8')
  if (!content) {
    const mtime = (await fsp.stat(file)).mtimeMs
    await new Promise((r) => {
      let n = 0
      const poll = async () => {
        n++
        const newMtime = (await fsp.stat(file)).mtimeMs
        if (newMtime !== mtime || n > 10) {
          r(0)
        } else {
          setTimeout(poll, 10)
        }
      }
      setTimeout(poll, 10)
    })
    return await fsp.readFile(file, 'utf-8')
  } else {
    return content
  }
}
