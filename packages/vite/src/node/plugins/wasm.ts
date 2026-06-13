import fsp from 'node:fs/promises'
import MagicString from 'magic-string'
import {
  init as esModuleLexerInit,
  parse as parseImports,
} from 'es-module-lexer'
import { exactRegex } from 'rolldown/filter'
import type { RolldownMagicString } from 'rolldown'
import { createToImportMetaURLBasedRelativeRuntime } from '../build'
import { type Plugin, perEnvironmentPlugin } from '../plugin'
import { cleanUrl } from '../../shared/utils'
import { injectQuery } from '../utils'
import { assetUrlRE, fileToUrl } from './asset'

const wasmHelperId = '\0vite/wasm-helper.js'

const wasmInitRE = /(?<![?#].*)\.wasm\?init/
const wasmSourceRE = /(?<![?#].*)\.wasm\?source/
const wasmDirectRE = /(?<![?#].*)\.wasm$/

// Detects the `import source` / `import.source(...)` phase forms cheaply so we
// only run the full lexer pass over modules that actually use them.
const wasmSourcePhaseRE = /\bimport\s+source\b|\bimport\s*\.\s*source\b/

const wasmInitUrlRE: RegExp = /__VITE_WASM_INIT__([\w$]+)__/g

// Enable the JS String Builtins and Imported String Constants proposals on
// compile/instantiate, matching the WebAssembly/ES Module Integration loader.
const wasmCompileOptions = {
  builtins: ['js-string'],
  importedStringConstants: 'wasm:js/string-constants',
}

// Decodes a base64 wasm data URL to bytes in both browser and SSR runtimes.
const dataUrlToBytes = (url: string) => {
  const urlContent = url.replace(/^data:.*?base64,/, '')
  if (typeof Buffer === 'function' && typeof Buffer.from === 'function') {
    return Buffer.from(urlContent, 'base64')
  } else if (typeof atob === 'function') {
    const binaryString = atob(urlContent)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }
  throw new Error(
    'Failed to decode base64-encoded data URL, Buffer and atob are not supported',
  )
}

const dataUrlToBytesCode = dataUrlToBytes.toString()

const wasmHelper = async (opts = {}, url: string) => {
  let result
  if (url.startsWith('data:')) {
    result = await WebAssembly.instantiate(
      dataUrlToBytes(url),
      opts,
      wasmCompileOptions,
    )
  } else {
    result = await instantiateFromUrl(url, opts)
  }
  return result.instance
}

const wasmHelperCode = wasmHelper.toString()

// Compiles a `.wasm` to a `WebAssembly.Module` without instantiating it, backing
// the source phase import (`import source mod from './mod.wasm'`). Callers own
// instantiation, mirroring the native source phase import semantics.
const compileWasm = async (url: string) => {
  if (url.startsWith('data:')) {
    return WebAssembly.compile(dataUrlToBytes(url), wasmCompileOptions)
  }
  return compileFromUrl(url)
}

const compileWasmCode = compileWasm.toString()

const instantiateFromUrl = async (url: string, opts?: WebAssembly.Imports) => {
  // https://github.com/mdn/webassembly-examples/issues/5
  // WebAssembly.instantiateStreaming requires the server to provide the
  // correct MIME type for .wasm files, which unfortunately doesn't work for
  // a lot of static file servers, so we just work around it by getting the
  // raw buffer.
  const response = await fetch(url)
  const contentType = response.headers.get('Content-Type') || ''
  if (
    'instantiateStreaming' in WebAssembly &&
    contentType.startsWith('application/wasm')
  ) {
    return WebAssembly.instantiateStreaming(response, opts, wasmCompileOptions)
  } else {
    const buffer = await response.arrayBuffer()
    return WebAssembly.instantiate(buffer, opts, wasmCompileOptions)
  }
}

const instantiateFromUrlCode = instantiateFromUrl.toString()

const compileFromUrl = async (url: string) => {
  const response = await fetch(url)
  const contentType = response.headers.get('Content-Type') || ''
  if (
    'compileStreaming' in WebAssembly &&
    contentType.startsWith('application/wasm')
  ) {
    return WebAssembly.compileStreaming(response, wasmCompileOptions)
  } else {
    const buffer = await response.arrayBuffer()
    return WebAssembly.compile(buffer, wasmCompileOptions)
  }
}

const compileFromUrlCode = compileFromUrl.toString()

const instantiateFromFile = async (
  fileUrlString: string,
  opts?: WebAssembly.Imports,
) => {
  const { readFile } = await import('node:fs/promises')
  const fileUrl = new URL(fileUrlString, /** #__KEEP__ */ import.meta.url)
  const buffer = await readFile(fileUrl)
  return WebAssembly.instantiate(buffer, opts, wasmCompileOptions)
}

const instantiateFromFileCode = instantiateFromFile.toString()

const compileFromFile = async (fileUrlString: string) => {
  const { readFile } = await import('node:fs/promises')
  const fileUrl = new URL(fileUrlString, /** #__KEEP__ */ import.meta.url)
  const buffer = await readFile(fileUrl)
  return WebAssembly.compile(buffer, wasmCompileOptions)
}

const compileFromFileCode = compileFromFile.toString()

export const wasmHelperPlugin = (): Plugin => {
  return perEnvironmentPlugin('vite:wasm-helper', (env) => {
    return {
      name: 'vite:wasm-helper',

      resolveId: {
        filter: { id: exactRegex(wasmHelperId) },
        handler(id) {
          return id
        },
      },

      // Rewrite source phase imports (`import source mod from './mod.wasm'` and
      // the dynamic `import.source('./mod.wasm')`) to a plain import of the
      // `?source` module, which resolves to a compiled `WebAssembly.Module`.
      // This polyfills the proposal on top of Vite's existing module pipeline.
      transform: {
        filter: { code: wasmSourcePhaseRE },
        async handler(code) {
          await esModuleLexerInit
          let imports: ReturnType<typeof parseImports>[0]
          try {
            ;[imports] = parseImports(code)
          } catch {
            return
          }

          let s: MagicString | undefined
          for (const imp of imports) {
            // 4 = `import source ...`, 5 = `import.source(...)`
            if (imp.t !== 4 && imp.t !== 5) continue
            const specifier = imp.n
            if (specifier === undefined) continue
            // Source phase imports are only meaningful for `.wasm` in Vite.
            if (!wasmDirectRE.test(cleanUrl(specifier))) continue

            s ??= new MagicString(code)
            const sourced = injectQuery(specifier, 'source')
            if (imp.t === 5) {
              // `import.source(spec)` resolves to the module source object (the
              // `WebAssembly.Module`), whereas `import(spec)` resolves to the
              // namespace, so rewrite to `import(spec?source).then(m => m.default)`.
              s.remove(imp.ss + 'import'.length, imp.d)
              // For dynamic imports the specifier span includes the quotes.
              s.update(imp.s, imp.e, JSON.stringify(sourced))
              s.appendLeft(imp.se, '.then((m) => m.default)')
            } else {
              // Drop the `source` phase keyword, keeping `import x from ...`.
              const keyword = imp.ss + 'import'.length
              const offset = code.slice(keyword, imp.s).indexOf('source')
              s.remove(keyword + offset, keyword + offset + 'source'.length + 1)
              s.update(imp.s, imp.e, sourced)
            }
          }

          if (!s) return
          return {
            code: s.toString(),
            map: s.generateMap({ hires: 'boundary' }),
          }
        },
      },

      load: {
        filter: {
          id: [
            exactRegex(wasmHelperId),
            wasmInitRE,
            wasmSourceRE,
            wasmDirectRE,
          ],
        },
        async handler(id) {
          const ssr = this.environment.config.consumer === 'server'

          if (id === wasmHelperId) {
            return `
const wasmCompileOptions = ${JSON.stringify(wasmCompileOptions)}
const dataUrlToBytes = ${dataUrlToBytesCode}
const instantiateFromUrl = ${ssr ? instantiateFromFileCode : instantiateFromUrlCode}
const compileFromUrl = ${ssr ? compileFromFileCode : compileFromUrlCode}
export default ${wasmHelperCode}
export const compileWasm = ${compileWasmCode}
`
          }

          const isInit = wasmInitRE.test(id)
          const isSource = wasmSourceRE.test(id)
          const cleanedId = id.split('?')[0]
          let url = await fileToUrl(this, cleanedId, ssr)
          assetUrlRE.lastIndex = 0
          if (ssr && assetUrlRE.test(url)) {
            url = url.replace('__VITE_ASSET__', '__VITE_WASM_INIT__')
          }

          if (isInit) {
            return `
  import initWasm from "${wasmHelperId}"
  export default opts => initWasm(opts, ${JSON.stringify(url)})
  `
          }

          if (isSource) {
            return `
import { compileWasm } from "${wasmHelperId}"
export default await compileWasm(${JSON.stringify(url)})
`
          }

          // Direct .wasm import (WASM ESM Integration)
          const wasmInfo = await parseWasm(cleanedId)
          const glueCode = generateGlueCode(wasmInfo, {
            initWasm: '__vite__initWasm',
            wasmUrl: '__vite__wasmUrl',
          })

          return `
import __vite__initWasm from "${wasmHelperId}"
const __vite__wasmUrl = ${JSON.stringify(url)}
${glueCode}
`
        },
      },

      renderChunk:
        env.config.consumer === 'server'
          ? {
              filter: { code: wasmInitUrlRE },
              handler(code, chunk, opts, meta) {
                const toRelativeRuntime =
                  createToImportMetaURLBasedRelativeRuntime(
                    opts.format,
                    this.environment.config.isWorker,
                  )

                let match: RegExpExecArray | null
                let s: RolldownMagicString | MagicString | undefined

                wasmInitUrlRE.lastIndex = 0
                while ((match = wasmInitUrlRE.exec(code))) {
                  const [full, referenceId] = match
                  const file = this.getFileName(referenceId)
                  chunk.viteMetadata!.importedAssets.add(cleanUrl(file))
                  const { runtime } = toRelativeRuntime(file, chunk.fileName)

                  s ??= meta.magicString ?? new MagicString(code)

                  s.update(
                    match.index,
                    match.index + full.length,
                    `"+${runtime}+"`,
                  )
                }

                if (!s) return null

                return meta.magicString
                  ? {
                      code: s as RolldownMagicString,
                    }
                  : {
                      code: s.toString(),
                      map: this.environment.config.build.sourcemap
                        ? (s as MagicString).generateMap({
                            hires: 'boundary',
                          })
                        : null,
                    }
              },
            }
          : undefined,
    }
  })
}

interface WasmInfo {
  imports: {
    from: string
    names: string[]
  }[]
  exports: string[]
}

async function parseWasm(wasmFilePath: string): Promise<WasmInfo> {
  try {
    const wasmBinary = await fsp.readFile(wasmFilePath)
    const wasmModule = await WebAssembly.compile(wasmBinary)
    const importMap: Record<string, string[]> = Object.create(null)
    for (const item of WebAssembly.Module.imports(wasmModule)) {
      importMap[item.module] ??= []
      importMap[item.module].push(item.name)
    }
    const imports = Object.entries(importMap).map(([from, names]) => ({
      from,
      names,
    }))

    const exports = WebAssembly.Module.exports(wasmModule).map(
      (item) => item.name,
    )

    return { imports, exports }
  } catch (e) {
    throw new Error(
      `Failed to parse WASM file "${wasmFilePath}": ${(e as Error).message}`,
      { cause: e },
    )
  }
}

function generateGlueCode(
  wasmInfo: WasmInfo,
  names: { initWasm: string; wasmUrl: string },
): string {
  const importStatements = wasmInfo.imports.map(({ from }, i) => {
    return `import * as __vite__wasmImport_${i} from ${JSON.stringify(from)};`
  })

  const importObject: SimpleObject = wasmInfo.imports.map(
    ({ from, names: importNames }, i) => {
      return {
        key: JSON.stringify(from),
        value: importNames.map((name) => {
          return {
            key: JSON.stringify(name),
            value: `__vite__wasmImport_${i}[${JSON.stringify(name)}]`,
          }
        }),
      }
    },
  )

  const initCode = `const __vite__wasmModule = (await ${names.initWasm}(${codegenSimpleObject(importObject)}, ${names.wasmUrl})).exports;`

  if (wasmInfo.exports.length === 0) {
    return [...importStatements, initCode].join('\n')
  }

  const exportStatements: string[] = []
  const nameMap = new Map<string, string>()
  for (const [index, name] of wasmInfo.exports.entries()) {
    if (isValidJsDeclareName(name)) {
      exportStatements.push(`  ${name},`)
    } else {
      const placeholderName = `__vite__wasmExport_${index}`
      exportStatements.push(`  ${JSON.stringify(name)}: ${placeholderName},`)
      nameMap.set(name, placeholderName)
    }
  }

  if (nameMap.size > 0) {
    exportStatements.unshift(`const {`)
    exportStatements.push(`} = __vite__wasmModule;`)
    exportStatements.push(`export {`)
    for (const name of wasmInfo.exports) {
      const localName = nameMap.get(name)
      if (localName) {
        exportStatements.push(`  ${localName} as ${JSON.stringify(name)},`)
      } else {
        exportStatements.push(`  ${name},`)
      }
    }
    exportStatements.push(`};`)
  } else {
    exportStatements.unshift(`export const {`)
    exportStatements.push(`} = __vite__wasmModule;`)
  }

  return [...importStatements, initCode, ...exportStatements].join('\n')
}

type SimpleObject = SimpleObjectKeyValue[]

interface SimpleObjectKeyValue {
  key: string
  value: string | SimpleObject
}

function codegenSimpleObject(obj: SimpleObject): string {
  if (obj.length === 0) return '{}'
  return `{ ${obj
    .map(({ key, value }) => {
      return `${key}: ${typeof value === 'string' ? value : codegenSimpleObject(value as SimpleObject)}`
    })
    .join(', ')} }`
}

const VALID_JS_IDENTIFIER = /^[$_\p{ID_Start}][$\p{ID_Continue}]*$/u

const RESERVED_WORDS = new Set([
  'abstract',
  'boolean',
  'break',
  'byte',
  'case',
  'catch',
  'char',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'double',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'final',
  'finally',
  'float',
  'for',
  'function',
  'goto',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'int',
  'interface',
  'let',
  'long',
  'native',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'short',
  'static',
  'super',
  'switch',
  'synchronized',
  'this',
  'throw',
  'throws',
  'transient',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'volatile',
  'while',
  'with',
  'yield',
])

function isValidJsDeclareName(name: string): boolean {
  return !RESERVED_WORDS.has(name) && VALID_JS_IDENTIFIER.test(name)
}
