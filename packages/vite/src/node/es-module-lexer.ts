import { simd } from 'wasm-feature-detect'

type Parse = typeof import('es-module-lexer').parse

let initPromise: Promise<void> | undefined
let parse: Parse | undefined

export function initEsModuleLexer(): Promise<void> {
  return (initPromise ??= loadLexer())
}

export const parseWithEsModuleLexer: Parse = (source, name) => {
  if (!parse) {
    throw new Error('Call and await initEsModuleLexer() before parsing')
  }
  return parse(source, name)
}

async function loadLexer(): Promise<void> {
  const supportsSimd = typeof WebAssembly !== 'undefined' && (await simd())
  const lexer = supportsSimd
    ? await import('es-module-lexer')
    : await import('es-module-lexer/js')
  await lexer.init()
  parse = lexer.parse
}
