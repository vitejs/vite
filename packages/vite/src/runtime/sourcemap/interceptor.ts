import type { OriginalMapping } from '@jridgewell/trace-mapping'
import type { ViteRuntime } from '../runtime'
import { posixDirname, posixResolve } from '../utils'
import type { ModuleCacheMap } from '../moduleCache'
import { slash } from '../../shared/utils'
import { DecodedMap, getOriginalPosition } from './decoder'

interface RetrieveFileHandler {
  (path: string): string | null | undefined | false
}

interface RetrieveSourceMapHandler {
  (path: string): null | { url: string; map: any }
}

export interface InterceptorOptions {
  retrieveFile?: RetrieveFileHandler
  retrieveSourceMap?: RetrieveSourceMapHandler
}

const sourceMapCache: Record<string, CachedMapEntry> = {}
const fileContentsCache: Record<string, string> = {}

const moduleGraphs: Set<ModuleCacheMap> = new Set()
const retrieveFileHandlers = new Set<RetrieveFileHandler>()
const retrieveSourceMapHandlers = new Set<RetrieveSourceMapHandler>()

const createExecHandlers = <T extends (...args: any) => any>(
  handlers: Set<T>,
) => {
  return ((...args: Parameters<T>) => {
    for (const handler of handlers) {
      const result = handler(...(args as []))
      if (result) return result
    }
    return null
  }) as T
}

const retrieveFileFromHandlers = createExecHandlers(retrieveFileHandlers)
const retrieveSourceMapFromHandlers = createExecHandlers(
  retrieveSourceMapHandlers,
)

let overridden = false
const originalPrepare = Error.prepareStackTrace

function resetInterceptor(runtime: ViteRuntime, options: InterceptorOptions) {
  moduleGraphs.delete(runtime.moduleCache)
  if (options.retrieveFile) retrieveFileHandlers.delete(options.retrieveFile)
  if (options.retrieveSourceMap)
    retrieveSourceMapHandlers.delete(options.retrieveSourceMap)
  if (moduleGraphs.size === 0) {
    Error.prepareStackTrace = originalPrepare
    overridden = false
  }
}

export function interceptStackTrace(
  runtime: ViteRuntime,
  options: InterceptorOptions = {},
): () => void {
  if (!overridden) {
    Error.prepareStackTrace = prepareStackTrace
    overridden = true
  }
  moduleGraphs.add(runtime.moduleCache)
  if (options.retrieveFile) retrieveFileHandlers.add(options.retrieveFile)
  if (options.retrieveSourceMap)
    retrieveSourceMapHandlers.add(options.retrieveSourceMap)
  return () => resetInterceptor(runtime, options)
}

interface CallSite extends NodeJS.CallSite {
  getScriptNameOrSourceURL(): string
}

interface State {
  nextPosition: null | OriginalMapping
  curPosition: null | OriginalMapping
}

interface CachedMapEntry {
  url: string | null
  map: DecodedMap | null
  vite?: boolean
}

// Support URLs relative to a directory, but be careful about a protocol prefix
function supportRelativeURL(file: string, url: string) {
  if (!file) return url
  const dir = posixDirname(slash(file))
  const match = /^\w+:\/\/[^/]*/.exec(dir)
  let protocol = match ? match[0] : ''
  const startPath = dir.slice(protocol.length)
  if (protocol && /^\/\w:/.test(startPath)) {
    // handle file:///C:/ paths
    protocol += '/'
    return protocol + slash(posixResolve(startPath, url))
  }
  return protocol + posixResolve(startPath, url)
}

function getRuntimeSourceMap(position: OriginalMapping): CachedMapEntry | null {
  for (const moduleCache of moduleGraphs) {
    const sourceMap = moduleCache.getSourceMap(position.source!)
    if (sourceMap) {
      return {
        url: position.source,
        map: sourceMap,
        vite: true,
      }
    }
  }
  return null
}

function retrieveFile(path: string): string | null | undefined | false {
  if (path in fileContentsCache) return fileContentsCache[path]
  const content = retrieveFileFromHandlers(path)
  if (typeof content === 'string') {
    fileContentsCache[path] = content
    return content
  }
  return null
}

function retrieveSourceMapURL(source: string) {
  // Get the URL of the source map
  const fileData = retrieveFile(source)
  if (!fileData) return null
  const re =
    /\/\/[@#]\s*sourceMappingURL=([^\s'"]+)\s*$|\/\*[@#]\s*sourceMappingURL=[^\s*'"]+\s*\*\/\s*$/gm
  // Keep executing the search to find the *last* sourceMappingURL to avoid
  // picking up sourceMappingURLs from comments, strings, etc.
  let lastMatch, match

  while ((match = re.exec(fileData))) lastMatch = match
  if (!lastMatch) return null
  return lastMatch[1]
}

const reSourceMap = /^data:application\/json[^,]+base64,/

function retrieveSourceMap(source: string) {
  const urlAndMap = retrieveSourceMapFromHandlers(source)
  if (urlAndMap) return urlAndMap

  let sourceMappingURL = retrieveSourceMapURL(source)
  if (!sourceMappingURL) return null

  // Read the contents of the source map
  let sourceMapData
  if (reSourceMap.test(sourceMappingURL)) {
    // Support source map URL as a data url
    const rawData = sourceMappingURL.slice(sourceMappingURL.indexOf(',') + 1)
    sourceMapData = Buffer.from(rawData, 'base64').toString()
    sourceMappingURL = source
  } else {
    // Support source map URLs relative to the source URL
    sourceMappingURL = supportRelativeURL(source, sourceMappingURL)
    sourceMapData = retrieveFile(sourceMappingURL)
  }

  if (!sourceMapData) return null

  return {
    url: sourceMappingURL,
    map: sourceMapData,
  }
}

function mapSourcePosition(position: OriginalMapping) {
  if (!position.source) return position
  let sourceMap = getRuntimeSourceMap(position)
  if (!sourceMap) sourceMap = sourceMapCache[position.source]
  if (!sourceMap) {
    // Call the (overrideable) retrieveSourceMap function to get the source map.
    const urlAndMap = retrieveSourceMap(position.source)
    if (urlAndMap && urlAndMap.map) {
      const url = urlAndMap.url
      sourceMap = sourceMapCache[position.source] = {
        url,
        map: new DecodedMap(
          typeof urlAndMap.map === 'string'
            ? JSON.parse(urlAndMap.map)
            : urlAndMap.map,
          url,
        ),
      }

      const contents = sourceMap.map?.map.sourcesContent
      // Load all sources stored inline with the source map into the file cache
      // to pretend like they are already loaded. They may not exist on disk.
      if (sourceMap.map && contents) {
        sourceMap.map.resolvedSources.forEach((source, i) => {
          const content = contents[i]
          if (content && source && url) {
            const contentUrl = supportRelativeURL(url, source)
            fileContentsCache[contentUrl] = content
          }
        })
      }
    } else {
      sourceMap = sourceMapCache[position.source] = {
        url: null,
        map: null,
      }
    }
  }

  // Resolve the source URL relative to the URL of the source map
  if (sourceMap && sourceMap.map && sourceMap.url) {
    const originalPosition = getOriginalPosition(sourceMap.map, position)

    // Only return the original position if a matching line was found. If no
    // matching line is found then we return position instead, which will cause
    // the stack trace to print the path and line for the compiled file. It is
    // better to give a precise location in the compiled file than a vague
    // location in the original file.
    if (originalPosition && originalPosition.source != null) {
      originalPosition.source = supportRelativeURL(
        sourceMap.url,
        originalPosition.source,
      )
      if (sourceMap.vite) {
        // @ts-expect-error vite is not defined
        originalPosition._vite = true
      }
      return originalPosition
    }
  }

  return position
}

// Parses code generated by FormatEvalOrigin(), a function inside V8:
// https://code.google.com/p/v8/source/browse/trunk/src/messages.js
function mapEvalOrigin(origin: string): string {
  // Most eval() calls are in this format
  let match = /^eval at ([^(]+) \((.+):(\d+):(\d+)\)$/.exec(origin)
  if (match) {
    const position = mapSourcePosition({
      name: null,
      source: match[2],
      line: +match[3],
      column: +match[4] - 1,
    })
    return `eval at ${match[1]} (${position.source}:${position.line}:${position.column + 1})`
  }

  // Parse nested eval() calls using recursion
  match = /^eval at ([^(]+) \((.+)\)$/.exec(origin)
  if (match) return `eval at ${match[1]} (${mapEvalOrigin(match[2])})`

  // Make sure we still return useful information if we didn't find anything
  return origin
}

// This is copied almost verbatim from the V8 source code at
// https://code.google.com/p/v8/source/browse/trunk/src/messages.js. The
// implementation of wrapCallSite() used to just forward to the actual source
// code of CallSite.prototype.toString but unfortunately a new release of V8
// did something to the prototype chain and broke the shim. The only fix I
// could find was copy/paste.
function CallSiteToString(this: CallSite) {
  let fileName
  let fileLocation = ''
  if (this.isNative()) {
    fileLocation = 'native'
  } else {
    fileName = this.getScriptNameOrSourceURL()
    if (!fileName && this.isEval()) {
      fileLocation = this.getEvalOrigin() as string
      fileLocation += ', ' // Expecting source position to follow.
    }

    if (fileName) {
      fileLocation += fileName
    } else {
      // Source code does not originate from a file and is not native, but we
      // can still get the source position inside the source string, e.g. in
      // an eval string.
      fileLocation += '<anonymous>'
    }
    const lineNumber = this.getLineNumber()
    if (lineNumber != null) {
      fileLocation += `:${lineNumber}`
      const columnNumber = this.getColumnNumber()
      if (columnNumber) fileLocation += `:${columnNumber}`
    }
  }

  let line = ''
  const functionName = this.getFunctionName()
  let addSuffix = true
  const isConstructor = this.isConstructor()
  const isMethodCall = !(this.isToplevel() || isConstructor)
  if (isMethodCall) {
    let typeName = this.getTypeName()
    // Fixes shim to be backward compatable with Node v0 to v4
    if (typeName === '[object Object]') typeName = 'null'

    const methodName = this.getMethodName()
    if (functionName) {
      if (typeName && functionName.indexOf(typeName) !== 0)
        line += `${typeName}.`

      line += functionName
      if (
        methodName &&
        functionName.indexOf(`.${methodName}`) !==
          functionName.length - methodName.length - 1
      )
        line += ` [as ${methodName}]`
    } else {
      line += `${typeName}.${methodName || '<anonymous>'}`
    }
  } else if (isConstructor) {
    line += `new ${functionName || '<anonymous>'}`
  } else if (functionName) {
    line += functionName
  } else {
    line += fileLocation
    addSuffix = false
  }
  if (addSuffix) line += ` (${fileLocation})`

  return line
}

function cloneCallSite(frame: CallSite) {
  const object = {} as CallSite
  Object.getOwnPropertyNames(Object.getPrototypeOf(frame)).forEach((name) => {
    const key = name as keyof CallSite
    // @ts-expect-error difficult to type
    object[key] = /^(?:is|get)/.test(name)
      ? function () {
          return frame[key].call(frame)
        }
      : frame[key]
  })
  object.toString = CallSiteToString
  return object
}

function wrapCallSite(frame: CallSite, state: State) {
  // provides interface backward compatibility
  if (state === undefined) state = { nextPosition: null, curPosition: null }

  if (frame.isNative()) {
    state.curPosition = null
    return frame
  }

  // Most call sites will return the source file from getFileName(), but code
  // passed to eval() ending in "//# sourceURL=..." will return the source file
  // from getScriptNameOrSourceURL() instead
  const source = frame.getFileName() || frame.getScriptNameOrSourceURL()
  if (source) {
    const line = frame.getLineNumber() as number
    let column = (frame.getColumnNumber() as number) - 1

    // Fix position in Node where some (internal) code is prepended.
    // See https://github.com/evanw/node-source-map-support/issues/36
    // Header removed in node at ^10.16 || >=11.11.0
    // v11 is not an LTS candidate, we can just test the one version with it.
    // Test node versions for: 10.16-19, 10.20+, 12-19, 20-99, 100+, or 11.11
    const headerLength = 62
    if (line === 1 && column > headerLength && !frame.isEval())
      column -= headerLength

    const position = mapSourcePosition({
      name: null,
      source,
      line,
      column,
    })
    state.curPosition = position
    frame = cloneCallSite(frame)
    const originalFunctionName = frame.getFunctionName
    frame.getFunctionName = function () {
      const name = (() => {
        if (state.nextPosition == null) return originalFunctionName()

        return state.nextPosition.name || originalFunctionName()
      })()
      return name === 'eval' && '_vite' in position ? null : name
    }
    frame.getFileName = function () {
      return position.source ?? undefined
    }
    frame.getLineNumber = function () {
      return position.line
    }
    frame.getColumnNumber = function () {
      return position.column + 1
    }
    frame.getScriptNameOrSourceURL = function () {
      return position.source as string
    }
    return frame
  }

  // Code called using eval() needs special handling
  let origin = frame.isEval() && frame.getEvalOrigin()
  if (origin) {
    origin = mapEvalOrigin(origin)
    frame = cloneCallSite(frame)
    frame.getEvalOrigin = function () {
      return origin || undefined
    }
    return frame
  }

  // If we get here then we were unable to change the source position
  return frame
}

function prepareStackTrace(error: Error, stack: CallSite[]) {
  const name = error.name || 'Error'
  const message = error.message || ''
  const errorString = `${name}: ${message}`

  const state = { nextPosition: null, curPosition: null }
  const processedStack = []
  for (let i = stack.length - 1; i >= 0; i--) {
    processedStack.push(`\n    at ${wrapCallSite(stack[i], state)}`)
    state.nextPosition = state.curPosition
  }
  state.curPosition = state.nextPosition = null
  return errorString + processedStack.reverse().join('')
}
