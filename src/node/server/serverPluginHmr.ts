// How HMR works
// 1. `.vue` files are transformed into `.js` files before being served
// 2. All `.js` files, before being served, are parsed to detect their imports
//    (this is done in `./serverPluginModuleRewrite.ts`) for module import rewriting.
//    During this we also record the importer/importee relationships which can be used for
//    HMR analysis (we do both at the same time to avoid double parse costs)
// 3. When a file changes, it triggers an HMR graph analysis, where we try to
//    walk its importer chains and see if we reach a "HMR boundary". An HMR
//    boundary is a file that explicitly indicated that it accepts hot updates
//    (by calling `import.meta.hot` APIs)
// 4. If any parent chain exhausts without ever running into an HMR boundary,
//    it's considered a "dead end". This causes a full page reload.
// 5. If a boundary is encountered, we check if the boundary's current
//    child importer is in the accepted list of the boundary (recorded while
//    parsing the file for HRM rewrite). If yes, record current child importer
//    in the `hmrBoundaries` Set.
// 6. If the graph walk finished without running into dead ends, send the
//    client to update all `hmrBoundaries`.

import { ServerPlugin } from '.'
import fs from 'fs'
import WebSocket from 'ws'
import path from 'path'
import chalk from 'chalk'
import { vueCache, srcImportMap } from './serverPluginVue'
import { resolveImport } from './serverPluginModuleRewrite'
import { FSWatcher } from 'chokidar'
import MagicString from 'magic-string'
import { parse } from '../utils/babelParse'
import { InternalResolver } from '../resolver'
import LRUCache from 'lru-cache'
import slash from 'slash'
import { cssPreprocessLangRE } from '../utils/cssUtils'
import {
  Node,
  StringLiteral,
  Statement,
  Expression,
  IfStatement
} from '@babel/types'

export const debugHmr = require('debug')('vite:hmr')

export type HMRWatcher = FSWatcher & {
  handleVueReload: (
    filePath: string,
    timestamp?: number,
    content?: string
  ) => void
  handleJSReload: (filePath: string, timestamp?: number) => void
  send: (payload: HMRPayload) => void
}

// while we lex the files for imports we also build a import graph
// so that we can determine what files to hot reload
type HMRStateMap = Map<string, Set<string>>

export const hmrAcceptanceMap: HMRStateMap = new Map()
export const hmrDeclineSet = new Set<string>()
export const importerMap: HMRStateMap = new Map()
export const importeeMap: HMRStateMap = new Map()

// files that are dirty (i.e. in the import chain between the accept boundrary
// and the actual changed file) for an hmr update at a given timestamp.
export const hmrDirtyFilesMap = new LRUCache<string, Set<string>>({ max: 10 })
export const latestVersionsMap = new Map<string, string>()

// client and node files are placed flat in the dist folder
export const hmrClientFilePath = path.resolve(__dirname, '../client.js')
export const hmrClientPublicPath = `/vite/hmr`

interface HMRPayload {
  type:
    | 'js-update'
    | 'vue-reload'
    | 'vue-rerender'
    | 'style-update'
    | 'style-remove'
    | 'full-reload'
    | 'sw-bust-cache'
    | 'custom'
  timestamp: number
  path?: string
  changeSrcPath?: string
  id?: string
  index?: number
  customData?: any
}

export const hmrPlugin: ServerPlugin = ({
  root,
  app,
  server,
  watcher,
  resolver,
  config
}) => {
  const hmrClient = fs
    .readFileSync(hmrClientFilePath, 'utf-8')
    .replace(`__SW_ENABLED__`, String(!!config.serviceWorker))

  app.use(async (ctx, next) => {
    if (ctx.path === hmrClientPublicPath) {
      ctx.type = 'js'
      ctx.status = 200
      ctx.body = hmrClient
    } else {
      if (ctx.query.t) {
        latestVersionsMap.set(ctx.path, ctx.query.t)
      }
      return next()
    }
  })

  // start a websocket server to send hmr notifications to the client
  const wss = new WebSocket.Server({ server })

  wss.on('connection', (socket) => {
    debugHmr('ws client connected')
    socket.send(JSON.stringify({ type: 'connected' }))
  })

  wss.on('error', (e: Error & { code: string }) => {
    if (e.code !== 'EADDRINUSE') {
      console.error(chalk.red(`[vite] WebSocket server error:`))
      console.error(e)
    }
  })

  const send = (watcher.send = (payload: HMRPayload) => {
    const stringified = JSON.stringify(payload, null, 2)
    debugHmr(`update: ${stringified}`)

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(stringified)
      }
    })
  })

  const handleJSReload = (watcher.handleJSReload = (
    filePath: string,
    timestamp: number = Date.now()
  ) => {
    // normal js file, but could be compiled from anything.
    // bust the vue cache in case this is a src imported file
    if (srcImportMap.has(filePath)) {
      debugHmr(`busting Vue cache for ${filePath}`)
      vueCache.del(filePath)
    }

    const publicPath = resolver.fileToRequest(filePath)
    const importers = importerMap.get(publicPath)
    if (importers || isHmrAccepted(publicPath, publicPath)) {
      const hmrBoundaries = new Set<string>()
      const dirtyFiles = new Set<string>()
      dirtyFiles.add(publicPath)

      const hasDeadEnd = walkImportChain(
        publicPath,
        importers || new Set(),
        hmrBoundaries,
        dirtyFiles
      )

      // record dirty files - this is used when HMR requests coming in with
      // timestamp to determine what files need to be force re-fetched
      hmrDirtyFilesMap.set(String(timestamp), dirtyFiles)

      const relativeFile = '/' + slash(path.relative(root, filePath))
      if (hasDeadEnd) {
        send({
          type: 'full-reload',
          path: publicPath,
          timestamp
        })
        console.log(chalk.green(`[vite] `) + `page reloaded.`)
      } else {
        hmrBoundaries.forEach((boundary) => {
          console.log(
            chalk.green(`[vite:hmr] `) +
              `${boundary} updated due to change in ${relativeFile}.`
          )
          send({
            type: boundary.endsWith('vue') ? 'vue-reload' : 'js-update',
            path: boundary,
            changeSrcPath: publicPath,
            timestamp
          })
        })
      }
    } else {
      debugHmr(`no importers for ${publicPath}.`)
      // bust sw cache anyway since this may be a full dynamic import.
      if (config.serviceWorker) {
        send({
          type: 'sw-bust-cache',
          path: publicPath,
          timestamp
        })
      }
    }
  })

  watcher.on('change', (file) => {
    if (
      !(
        file.endsWith('.vue') ||
        file.endsWith('.css') ||
        cssPreprocessLangRE.test(file)
      )
    ) {
      // everything except plain .css are considered HMR dependencies.
      // plain css has its own HMR logic in ./serverPluginCss.ts.
      handleJSReload(file)
    }
  })
}

function walkImportChain(
  importee: string,
  importers: Set<string>,
  hmrBoundaries: Set<string>,
  dirtyFiles: Set<string>,
  currentChain: string[] = []
): boolean {
  if (hmrDeclineSet.has(importee)) {
    // module explicitly declines HMR = dead end
    return true
  }

  if (isHmrAccepted(importee, importee)) {
    // self-accepting module.
    hmrBoundaries.add(importee)
    dirtyFiles.add(importee)
    return false
  }

  for (const importer of importers) {
    if (importer.endsWith('.vue') || isHmrAccepted(importer, importee)) {
      // vue boundaries are considered dirty for the reload
      if (importer.endsWith('.vue')) {
        dirtyFiles.add(importer)
      }
      hmrBoundaries.add(importer)
      currentChain.forEach((file) => dirtyFiles.add(file))
    } else {
      const parentImpoters = importerMap.get(importer)
      if (!parentImpoters) {
        return true
      } else if (
        walkImportChain(
          importer,
          parentImpoters,
          hmrBoundaries,
          dirtyFiles,
          currentChain.concat(importer)
        )
      ) {
        return true
      }
    }
  }
  return false
}

function isHmrAccepted(importer: string, dep: string): boolean {
  const deps = hmrAcceptanceMap.get(importer)
  return deps ? deps.has(dep) : false
}

export function ensureMapEntry(map: HMRStateMap, key: string): Set<string> {
  let entry = map.get(key)
  if (!entry) {
    entry = new Set<string>()
    map.set(key, entry)
  }
  return entry
}

export function rewriteFileWithHMR(
  root: string,
  source: string,
  importer: string,
  resolver: InternalResolver,
  s: MagicString
) {
  let hasDeclined = false
  let importMetaConditional: IfStatement | undefined

  const registerDep = (e: StringLiteral) => {
    const deps = ensureMapEntry(hmrAcceptanceMap, importer)
    const depPublicPath = resolveImport(root, importer, e.value, resolver)
    deps.add(depPublicPath)
    debugHmr(`        ${importer} accepts ${depPublicPath}`)
    ensureMapEntry(importerMap, depPublicPath).add(importer)
    s.overwrite(e.start!, e.end!, JSON.stringify(depPublicPath))
  }

  const checkHotCall = (
    node: Expression,
    isTopLevel: boolean,
    isDevBlock: boolean
  ) => {
    if (
      node.type === 'CallExpression' &&
      node.callee.type === 'MemberExpression' &&
      isMetaHot(node.callee.object)
    ) {
      if (isTopLevel) {
        console.warn(
          chalk.yellow(
            `[vite] HMR syntax error in ${importer}: import.meta.hot.accept() ` +
              `should be wrapped in \`if (import.meta.hot) {}\` conditional ` +
              `blocks so that they can be tree-shaken in production.`
          )
          // TODO generateCodeFrame
        )
      }

      const method = node.callee.property.name
      if (method === 'accept' || method === 'acceptDeps') {
        if (!isDevBlock) {
          console.error(
            chalk.yellow(
              `[vite] HMR syntax error in ${importer}: import.meta.hot.${method}() ` +
                `cannot be conditional except for \`if (import.meta.hot)\` check ` +
                `because the server relies on static analysis to construct the HMR graph.`
            )
          )
        }
        // register the accepted deps
        const accepted = node.arguments[0]
        if (accepted && accepted.type === 'ArrayExpression') {
          if (method !== 'acceptDeps') {
            console.error(
              chalk.yellow(
                `[vite] HMR syntax error in ${importer}: hot.accept() only accepts ` +
                  `a single callback. Use hot.acceptDeps() to handle dep updates.`
              )
            )
          }
          // import.meta.hot.accept(['./foo', './bar'], () => {})
          accepted.elements.forEach((e) => {
            if (e && e.type !== 'StringLiteral') {
              console.error(
                chalk.yellow(
                  `[vite] HMR syntax error in ${importer}: hot.accept() deps ` +
                    `list can only contain string literals.`
                )
              )
            } else if (e) {
              registerDep(e)
            }
          })
        } else if (accepted && accepted.type === 'StringLiteral') {
          if (method !== 'acceptDeps') {
            console.error(
              chalk.yellow(
                `[vite] HMR syntax error in ${importer}: hot.accept() only accepts ` +
                  `a single callback. Use hot.acceptDeps() to handle dep updates.`
              )
            )
          }
          // import.meta.hot.accept('./foo', () => {})
          registerDep(accepted)
        } else if (!accepted || accepted.type.endsWith('FunctionExpression')) {
          if (method !== 'accept') {
            console.error(
              chalk.yellow(
                `[vite] HMR syntax error in ${importer}: hot.acceptDeps() ` +
                  `expects a dependency or an array of dependencies. ` +
                  `Use hot.accept() for handling self updates.`
              )
            )
          }
          // self accepting
          // import.meta.hot.accept() OR import.meta.hot.accept(() => {})
          ensureMapEntry(hmrAcceptanceMap, importer).add(importer)
          debugHmr(`${importer} self accepts`)
        } else {
          console.error(
            chalk.yellow(
              `[vite] HMR syntax error in ${importer}: ` +
                `import.meta.hot.accept() expects a dep string, an array of ` +
                `deps, or a callback.`
            )
          )
        }
      }

      if (method === 'decline') {
        hasDeclined = true
        hmrDeclineSet.add(importer)
      }
    }
  }

  const checkStatements = (
    node: Statement,
    isTopLevel: boolean,
    isDevBlock: boolean
  ) => {
    if (node.type === 'ExpressionStatement') {
      // top level hot.accept() call
      checkHotCall(node.expression, isTopLevel, isDevBlock)
    }
    // if (import.meta.hot) ...
    if (node.type === 'IfStatement') {
      const isDevBlock = isMetaHot(node.test)
      if (isDevBlock && !importMetaConditional) {
        // remember the first occurence of `if (import.meta.hot)`
        importMetaConditional = node
      }
      if (node.consequent.type === 'BlockStatement') {
        node.consequent.body.forEach((s) =>
          checkStatements(s, false, isDevBlock)
        )
      }
      if (node.consequent.type === 'ExpressionStatement') {
        checkHotCall(node.consequent.expression, false, isDevBlock)
      }
    }
  }

  const ast = parse(source)
  ast.forEach((s) => checkStatements(s, true, false))

  if (importMetaConditional) {
    // inject import.meta.hot
    s.prependLeft(
      importMetaConditional.start!,
      `import { createHotContext } from "${hmrClientPublicPath}"; ` +
        `import.meta.hot = createHotContext(${JSON.stringify(importer)}); `
    )
  }

  // clear decline state
  if (!hasDeclined) {
    hmrDeclineSet.delete(importer)
  }
}

function isMetaHot(node: Node) {
  return (
    node.type === 'MemberExpression' &&
    node.object.type === 'MetaProperty' &&
    node.property.type === 'Identifier' &&
    node.property.name === 'hot'
  )
}
