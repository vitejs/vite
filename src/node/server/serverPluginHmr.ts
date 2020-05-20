// How HMR works
// 1. `.vue` files are transformed into `.js` files before being served
// 2. All `.js` files, before being served, are parsed to detect their imports
//    (this is done in `./serverPluginModuleRewrite.ts`) for module import rewriting.
//    During this we also record the importer/importee relationships which can be used for
//    HMR analysis (we do both at the same time to avoid double parse costs)
// 3. When a `.vue` file changes, we directly read, parse it again and
//    send the client because Vue components are self-accepting by nature
// 4. When a js file changes, it triggers an HMR graph analysis, where we try to
//    walk its importer chains and see if we reach a "HMR boundary". An HMR
//    boundary is either a `.vue` file or a `.js` file that explicitly indicated
//    that it accepts hot updates (by importing from the `/vite/hmr` special module)
// 5. If any parent chain exhausts without ever running into an HMR boundary,
//    it's considered a "dead end". This causes a full page reload.
// 6. If a `.vue` boundary is encountered, we add it to the `vueBoundaries` Set.
// 7. If a `.js` boundary is encountered, we check if the boundary's current
//    child importer is in the accepted list of the boundary (see additional
//    explanation below). If yes, record current child importer in the
//    `jsBoundaries` Set.
// 8. If the graph walk finished without running into dead ends, send the
//    client to update all `jsBoundaries` and `vueBoundaries`.

// How do we get a js HMR boundary's accepted list on the server
// 1. During the import rewriting, if `/vite/hmr` import is present in a js file,
//    we will do a fullblown parse of the file to find the `hot.accept` call,
//    and records the file and its accepted dependencies in a `hmrBoundariesMap`
// 2. We also inject the boundary file's full path into the `hot.accept` call
//    so that on the client, the `hot.accept` call would have registered for
//    updates using the full paths of the dependencies.

import { ServerPlugin } from '.'
import fs from 'fs'
import WebSocket from 'ws'
import path from 'path'
import chalk from 'chalk'
import hash_sum from 'hash-sum'
import { SFCBlock } from '@vue/compiler-sfc'
import { parseSFC, vueCache, srcImportMap } from './serverPluginVue'
import { resolveImport } from './serverPluginModuleRewrite'
import { FSWatcher } from 'chokidar'
import MagicString from 'magic-string'
import { parse } from '@babel/parser'
import { StringLiteral, Statement, Expression } from '@babel/types'
import { InternalResolver } from '../resolver'
import LRUCache from 'lru-cache'
import slash from 'slash'

export const debugHmr = require('debug')('vite:hmr')

export type HMRWatcher = FSWatcher & {
  handleVueReload: (file: string, timestamp?: number, content?: string) => void
  handleJSReload: (file: string, timestamp?: number) => void
  send: (payload: HMRPayload) => void
}

// while we lex the files for imports we also build a import graph
// so that we can determine what files to hot reload
type HMRStateMap = Map<string, Set<string>>

export const hmrAcceptanceMap: HMRStateMap = new Map()
export const importerMap: HMRStateMap = new Map()
export const importeeMap: HMRStateMap = new Map()

// files that are dirty (i.e. in the import chain between the accept boundrary
// and the actual changed file) for an hmr update at a given timestamp.
export const hmrDirtyFilesMap = new LRUCache<string, Set<string>>({ max: 10 })

// client and node files are placed flat in the dist folder
export const hmrClientFilePath = path.resolve(__dirname, '../client.js')
export const hmrClientId = 'vite/hmr'
export const hmrClientPublicPath = `/${hmrClientId}`

interface HMRPayload {
  type:
    | 'vue-rerender'
    | 'vue-reload'
    | 'vue-style-update'
    | 'js-update'
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

  const send = (payload: HMRPayload) => {
    const stringified = JSON.stringify(payload, null, 2)
    debugHmr(`update: ${stringified}`)

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(stringified)
      }
    })
  }

  watcher.handleVueReload = handleVueReload
  watcher.handleJSReload = handleJSReload
  watcher.send = send

  // exclude files declared as css by user transforms
  const cssTransforms = config.transforms
    ? config.transforms.filter((t) => t.as === 'css')
    : []

  watcher.on('change', async (file) => {
    const timestamp = Date.now()
    if (resolver.fileToRequest(file) === '/index.html') {
      send({
        type: 'full-reload',
        path: '/index.html',
        timestamp
      })
      console.log(chalk.green(`[vite] `) + `page reloaded.`)
    } else if (file.endsWith('.vue')) {
      handleVueReload(file, timestamp)
    } else if (
      !(file.endsWith('.css') || cssTransforms.some((t) => t.test(file, {})))
    ) {
      // everything except plain .css are considered HMR dependencies.
      // plain css has its own HMR logic in ./serverPluginCss.ts.
      handleJSReload(file, timestamp)
    }
  })

  async function handleVueReload(
    file: string,
    timestamp: number = Date.now(),
    content?: string
  ) {
    const publicPath = resolver.fileToRequest(file)
    const cacheEntry = vueCache.get(file)

    debugHmr(`busting Vue cache for ${file}`)
    vueCache.del(file)

    const descriptor = await parseSFC(root, file, content)
    if (!descriptor) {
      // read failed
      return
    }

    const prevDescriptor = cacheEntry && cacheEntry.descriptor
    if (!prevDescriptor) {
      // the file has never been accessed yet
      debugHmr(`no existing descriptor found for ${file}`)
      return
    }

    // check which part of the file changed
    let needReload = false
    let needCssModuleReload = false
    let needRerender = false

    if (!isEqual(descriptor.script, prevDescriptor.script)) {
      needReload = true
    }

    if (!isEqual(descriptor.template, prevDescriptor.template)) {
      needRerender = true
    }

    let didUpdateStyle = false
    const styleId = hash_sum(publicPath)
    const prevStyles = prevDescriptor.styles || []
    const nextStyles = descriptor.styles || []
    if (
      !needReload &&
      prevStyles.some((s) => s.scoped) !== nextStyles.some((s) => s.scoped)
    ) {
      needReload = true
    }

    // css modules update causes a reload because the $style object is changed
    // and it may be used in JS. It also needs to trigger a vue-style-update
    // event so the client busts the sw cache.
    if (
      prevStyles.some((s) => s.module != null) ||
      nextStyles.some((s) => s.module != null)
    ) {
      needCssModuleReload = true
    }

    // only need to update styles if not reloading, since reload forces
    // style updates as well.
    if (!needReload) {
      nextStyles.forEach((_, i) => {
        if (!prevStyles[i] || !isEqual(prevStyles[i], nextStyles[i])) {
          didUpdateStyle = true
          send({
            type: 'vue-style-update',
            path: publicPath,
            index: i,
            id: `${styleId}-${i}`,
            timestamp
          })
        }
      })
    }

    // stale styles always need to be removed
    prevStyles.slice(nextStyles.length).forEach((_, i) => {
      didUpdateStyle = true
      send({
        type: 'style-remove',
        path: publicPath,
        id: `${styleId}-${i + nextStyles.length}`,
        timestamp
      })
    })

    if (needReload || needCssModuleReload) {
      send({
        type: 'vue-reload',
        path: publicPath,
        timestamp
      })
    } else if (needRerender) {
      send({
        type: 'vue-rerender',
        path: publicPath,
        timestamp
      })
    }

    if (needReload || needRerender || didUpdateStyle) {
      let updateType = needReload ? `reload` : needRerender ? `template` : ``
      if (didUpdateStyle) {
        updateType += ` & style`
      }
      console.log(
        chalk.green(`[vite:hmr] `) +
          `${path.relative(root, file)} updated. (${updateType})`
      )
    }
  }

  function handleJSReload(filePath: string, timestamp: number = Date.now()) {
    // normal js file, but could be compiled from anything.
    // bust the vue cache in case this is a src imported file
    if (srcImportMap.has(filePath)) {
      debugHmr(`busting Vue cache for ${filePath}`)
      vueCache.del(filePath)
    }

    const publicPath = resolver.fileToRequest(filePath)
    const importers = importerMap.get(publicPath)
    if (importers) {
      const vueBoundaries = new Set<string>()
      const jsBoundaries = new Set<string>()
      const dirtyFiles = new Set<string>()
      dirtyFiles.add(publicPath)

      const hasDeadEnd = walkImportChain(
        publicPath,
        importers,
        vueBoundaries,
        jsBoundaries,
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
        vueBoundaries.forEach((vueBoundary) => {
          console.log(
            chalk.green(`[vite:hmr] `) +
              `${vueBoundary} reloaded due to change in ${relativeFile}.`
          )
          send({
            type: 'vue-reload',
            path: vueBoundary,
            changeSrcPath: publicPath,
            timestamp
          })
        })
        jsBoundaries.forEach((jsBoundary) => {
          console.log(
            chalk.green(`[vite:hmr] `) +
              `${jsBoundary} updated due to change in ${relativeFile}.`
          )
          send({
            type: 'js-update',
            path: jsBoundary,
            changeSrcPath: publicPath,
            timestamp
          })
        })
      }
    } else {
      debugHmr(`no importers for ${publicPath}.`)
    }
  }
}

function walkImportChain(
  importee: string,
  importers: Set<string>,
  vueBoundaries: Set<string>,
  jsBoundaries: Set<string>,
  dirtyFiles: Set<string>,
  currentChain: string[] = []
): boolean {
  if (isHmrAccepted(importee, importee)) {
    // self-accepting module.
    jsBoundaries.add(importee)
    dirtyFiles.add(importee)
    return false
  }

  let hasDeadEnd = false
  for (const importer of importers) {
    if (importer.endsWith('.vue')) {
      vueBoundaries.add(importer)
      dirtyFiles.add(importer)
      currentChain.forEach((file) => dirtyFiles.add(file))
    } else if (isHmrAccepted(importer, importee)) {
      jsBoundaries.add(importer)
      // js boundaries themselves are not considered dirty
      currentChain.forEach((file) => dirtyFiles.add(file))
    } else {
      const parentImpoters = importerMap.get(importer)
      if (!parentImpoters) {
        hasDeadEnd = true
      } else {
        hasDeadEnd = walkImportChain(
          importer,
          parentImpoters,
          vueBoundaries,
          jsBoundaries,
          dirtyFiles,
          currentChain.concat(importer)
        )
      }
    }
  }
  return hasDeadEnd
}

function isHmrAccepted(importer: string, dep: string): boolean {
  const deps = hmrAcceptanceMap.get(importer)
  return deps ? deps.has(dep) : false
}

function isEqual(a: SFCBlock | null, b: SFCBlock | null) {
  if (!a && !b) return true
  if (!a || !b) return false
  if (a.content !== b.content) return false
  const keysA = Object.keys(a.attrs)
  const keysB = Object.keys(b.attrs)
  if (keysA.length !== keysB.length) {
    return false
  }
  return keysA.every((key) => a.attrs[key] === b.attrs[key])
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
      node.callee.object.type === 'Identifier' &&
      node.callee.object.name === 'hot'
    ) {
      if (isTopLevel) {
        console.warn(
          chalk.yellow(
            `[vite warn] HMR syntax error in ${importer}: hot.accept() should be` +
              `wrapped in \`if (__DEV__) {}\` conditional blocks so that they ` +
              `can be tree-shaken in production.`
          )
          // TODO generateCodeFrame
        )
      }

      if (node.callee.property.name === 'accept') {
        if (!isDevBlock) {
          console.error(
            chalk.yellow(
              `[vite] HMR syntax error in ${importer}: hot.accept() cannot be ` +
                `conditional except for __DEV__ check because the server relies ` +
                `on static analysis to construct the HMR graph.`
            )
          )
        }
        const args = node.arguments
        const appendPoint = args.length ? args[0].start! : node.end! - 1
        // inject the imports's own path so it becomes
        // hot.accept('/foo.js', ['./bar.js'], () => {})
        s.appendLeft(appendPoint, JSON.stringify(importer) + ', ')
        // register the accepted deps
        const accepted = args[0]
        if (accepted && accepted.type === 'ArrayExpression') {
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
          registerDep(accepted)
        } else if (!accepted || accepted.type.endsWith('FunctionExpression')) {
          // self accepting, rewrite to inject itself
          // hot.accept(() => {})  -->  hot.accept('/foo.js', '/foo.js', () => {})
          s.appendLeft(appendPoint, JSON.stringify(importer) + ', ')
          ensureMapEntry(hmrAcceptanceMap, importer).add(importer)
        } else {
          console.error(
            chalk.yellow(
              `[vite] HMR syntax error in ${importer}: ` +
                `hot.accept() expects a dep string, an array of deps, or a callback.`
            )
          )
        }
      }

      if (node.callee.property.name === 'dispose') {
        // inject the imports's own path to dispose calls as well
        s.appendLeft(node.arguments[0].start!, JSON.stringify(importer) + ', ')
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
      // __DEV__ && hot.accept()
      if (
        node.expression.type === 'LogicalExpression' &&
        node.expression.operator === '&&' &&
        node.expression.left.type === 'Identifier' &&
        node.expression.left.name === '__DEV__'
      ) {
        checkHotCall(node.expression.right, false, isDevBlock)
      }
    }
    // if (__DEV__) ...
    if (node.type === 'IfStatement') {
      const isDevBlock =
        node.test.type === 'Identifier' && node.test.name === '__DEV__'
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

  const ast = parse(source, {
    sourceType: 'module',
    plugins: [
      'importMeta',
      // by default we enable proposals slated for ES2020.
      // full list at https://babeljs.io/docs/en/next/babel-parser#plugins
      // this should be kept in async with @vue/compiler-core's support range
      'bigInt',
      'optionalChaining',
      'nullishCoalescingOperator'
    ]
  }).program.body

  ast.forEach((s) => checkStatements(s, true, false))
}
