import fsp from 'node:fs/promises'
import MagicString from 'magic-string'
import { exactRegex } from 'rolldown/filter'
import type { RolldownMagicString } from 'rolldown'
import { createToImportMetaURLBasedRelativeRuntime } from '../build'
import { type Plugin, perEnvironmentPlugin } from '../plugin'
import { cleanUrl } from '../../shared/utils'
import { assetUrlRE, fileToUrl } from './asset'

const wasmHelperId = '\0vite/wasm-helper.js'

const wasmInitRE = /(?<![?#].*)\.wasm\?init/
const wasmDirectRE = /(?<![?#].*)\.wasm$/

// Lower "instance" layer of a directly imported `.wasm` module that exports a
// WebAssembly.Global. It owns the WebAssembly.Instance and exposes exports
// verbatim (globals stay WebAssembly.Global objects), so that wasm-to-wasm
// global imports receive the actual Global. The user-facing `.wasm` module is a
// thin wrapper around this layer that unwraps globals for JS consumers.
const wasmInstanceSuffix = '?vite-wasm-instance'
const wasmInstanceRE = /[?&]vite-wasm-instance(?:&|$)/

const wasmInitUrlRE: RegExp = /__VITE_WASM_INIT__([\w$]+)__/g

// Enabled per spec
const wasmCompileOptions = {
  builtins: ['js-string'],
  importedStringConstants: 'wasm:js/string-constants',
}

// Modules satisfied by the engine when the above proposals are enabled. They
// must never surface as JS imports in the generated glue. The host Node running
// `parseWasm` may not support these proposals yet (older versions), in which
// case `WebAssembly.Module.imports` still reports them, so we filter explicitly.
const wasmReservedModules = new Set<string>([
  ...wasmCompileOptions.builtins.map((name) => `wasm:${name}`),
  wasmCompileOptions.importedStringConstants,
])

const wasmHelper = async (opts = {}, url: string) => {
  let result
  if (url.startsWith('data:')) {
    const urlContent = url.replace(/^data:.*?base64,/, '')
    let bytes
    if (typeof Buffer === 'function' && typeof Buffer.from === 'function') {
      bytes = Buffer.from(urlContent, 'base64')
    } else if (typeof atob === 'function') {
      const binaryString = atob(urlContent)
      bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
    } else {
      throw new Error(
        'Failed to decode base64-encoded data URL, Buffer and atob are not supported',
      )
    }
    result = await WebAssembly.instantiate(bytes, opts, wasmCompileOptions)
  } else {
    result = await instantiateFromUrl(url, opts)
  }
  return result.instance
}

const wasmHelperCode = wasmHelper.toString()

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

      load: {
        filter: {
          id: [
            exactRegex(wasmHelperId),
            wasmInitRE,
            wasmDirectRE,
            wasmInstanceRE,
          ],
        },
        async handler(id) {
          const ssr = this.environment.config.consumer === 'server'

          if (id === wasmHelperId) {
            return `
const wasmCompileOptions = ${JSON.stringify(wasmCompileOptions)}
const instantiateFromUrl = ${ssr ? instantiateFromFileCode : instantiateFromUrlCode}
export default ${wasmHelperCode}
`
          }

          const isInit = wasmInitRE.test(id)
          const isInstance = wasmInstanceRE.test(id)
          const cleanedId = isInstance ? cleanUrl(id) : id.split('?')[0]

          // Direct .wasm import (WASM ESM Integration)
          let wasmInfo: WasmInfo | undefined
          if (!isInit) {
            wasmInfo = await parseWasm(cleanedId)
            // The user-facing module of a wasm that exports a global is a thin
            // wrapper that re-exports the instance layer, unwrapping globals for JS.
            if (!isInstance && wasmInfo.hasGlobalExport) {
              return generateWrapperGlue(
                wasmInfo,
                cleanedId + wasmInstanceSuffix,
              )
            }
          }

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

          const glueCode = generateInstanceGlue(wasmInfo!, {
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

interface WasmName {
  name: string
  isGlobal: boolean
}

interface WasmInfo {
  imports: {
    from: string
    names: WasmName[]
  }[]
  exports: WasmName[]
  hasGlobalExport: boolean
}

async function parseWasm(wasmFilePath: string): Promise<WasmInfo> {
  try {
    const wasmBinary = await fsp.readFile(wasmFilePath)
    const wasmModule = await WebAssembly.compile(wasmBinary, wasmCompileOptions)
    const importMap = new Map<string, WasmName[]>()
    for (const item of WebAssembly.Module.imports(wasmModule)) {
      if (wasmReservedModules.has(item.module)) continue
      let names = importMap.get(item.module)
      if (!names) importMap.set(item.module, (names = []))
      names.push({ name: item.name, isGlobal: item.kind === 'global' })
    }
    const imports = [...importMap].map(([from, names]) => ({ from, names }))

    let hasGlobalExport = false
    const exports = WebAssembly.Module.exports(wasmModule).map((item) => {
      const isGlobal = item.kind === 'global'
      if (isGlobal) hasGlobalExport = true
      return { name: item.name, isGlobal }
    })

    return { imports, exports, hasGlobalExport }
  } catch (e) {
    throw new Error(
      `Failed to parse WASM file "${wasmFilePath}": ${(e as Error).message}`,
      { cause: e },
    )
  }
}

// Instantiates the wasm module and re-exports its exports verbatim. Globals stay
// WebAssembly.Global objects so wasm-to-wasm global imports get the live cell.
function generateInstanceGlue(
  wasmInfo: WasmInfo,
  names: { initWasm: string; wasmUrl: string },
): string {
  const importStatements: string[] = []
  const importObject: SimpleObject = wasmInfo.imports.map(
    ({ from, names: importNames }, i) => {
      const value: SimpleObject = []
      const globals = importNames.filter((n) => n.isGlobal)
      const others = importNames.filter((n) => !n.isGlobal)
      if (others.length > 0) {
        const ns = `__vite__wasmImport_${i}`
        importStatements.push(`import * as ${ns} from ${JSON.stringify(from)};`)
        for (const { name } of others) {
          value.push({
            key: JSON.stringify(name),
            value: `${ns}[${JSON.stringify(name)}]`,
          })
        }
      }
      if (globals.length > 0) {
        // Wasm global imports need the WebAssembly.Global object, so import them
        // from the exporter's instance layer instead of its JS-unwrapped value.
        const ns = `__vite__wasmImportInstance_${i}`
        importStatements.push(
          `import * as ${ns} from ${JSON.stringify(from + wasmInstanceSuffix)};`,
        )
        for (const { name } of globals) {
          value.push({
            key: JSON.stringify(name),
            value: `${ns}[${JSON.stringify(name)}]`,
          })
        }
      }
      return { key: JSON.stringify(from), value }
    },
  )

  const initCode = `const __vite__wasmModule = (await ${names.initWasm}(${codegenSimpleObject(importObject)}, ${names.wasmUrl})).exports;`

  if (wasmInfo.exports.length === 0) {
    return [...importStatements, initCode].join('\n')
  }

  const exportStatements: string[] = []
  const nameMap = new Map<string, string>()
  for (const [index, { name }] of wasmInfo.exports.entries()) {
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
    for (const { name } of wasmInfo.exports) {
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

// User-facing module of a wasm that exports a global. Re-exports the instance
// layer and overrides each global with its unwrapped JS value.
function generateWrapperGlue(wasmInfo: WasmInfo, instanceId: string): string {
  const instanceIdLiteral = JSON.stringify(instanceId)
  const lines = [`export * from ${instanceIdLiteral};`]

  // `export *` skips `default`, so re-export it explicitly when present.
  if (wasmInfo.exports.some((e) => e.name === 'default')) {
    lines.push(`export { default } from ${instanceIdLiteral};`)
  }

  const imports: string[] = []
  const bindings: string[] = []
  const unwraps: string[] = []
  const reExports: string[] = []
  for (const [index, { name, isGlobal }] of wasmInfo.exports.entries()) {
    if (!isGlobal || name === 'default') continue
    const alias = `__vite__wasmGlobal_${index}`
    imports.push(`${codegenModuleExportName(name)} as ${alias}`)
    // Use the export name as the binding directly; only non-identifier names
    // need a separate aliased local.
    const binding = isValidJsDeclareName(name)
      ? name
      : `__vite__wasmGlobalValue_${index}`
    bindings.push(binding)
    // v128 globals throw in GetGlobalValue and have no JS value, so stay undefined.
    unwraps.push(`try { ${binding} = ${alias}.value; } catch {}`)
    reExports.push(
      binding === name ? name : `${binding} as ${JSON.stringify(name)}`,
    )
  }

  if (bindings.length > 0) {
    lines.push(`import { ${imports.join(', ')} } from ${instanceIdLiteral};`)
    lines.push(`let ${bindings.join(', ')};`)
    lines.push(...unwraps)
    lines.push(`export { ${reExports.join(', ')} };`)
  }

  return lines.join('\n')
}

function codegenModuleExportName(name: string): string {
  return isValidJsDeclareName(name) ? name : JSON.stringify(name)
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
