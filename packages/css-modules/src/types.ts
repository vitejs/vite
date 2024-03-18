export interface CSSModulesOptions {
  getJSON?: (
    cssFileName: string,
    json: Record<string, string>,
    outputFileName: string,
  ) => void
  scopeBehaviour?: 'global' | 'local'
  globalModulePaths?: RegExp[]
  exportGlobals?: boolean
  generateScopedName?:
    | string
    | ((name: string, filename: string, css: string) => string)
  hashPrefix?: string
  /**
   * default: undefined
   */
  localsConvention?:
    | 'camelCase'
    | 'camelCaseOnly'
    | 'dashes'
    | 'dashesOnly'
    | ((
        originalClassName: string,
        generatedClassName: string,
        inputFile: string,
      ) => string)
}

// https://github.com/jridgewell/trace-mapping/blob/5a658b10d9b6dea9c614ff545ca9c4df895fee9e/src/types.ts#L4-L16
export interface RawSourceMap {
  file?: string | null
  names: string[]
  sourceRoot?: string
  sources: (string | null)[]
  sourcesContent?: (string | null)[]
  version: 3
  ignoreList?: number[]
  mappings: string
}

/**
 * This is designed for parity with LightningCSS
 * so it they can be used as a drop-in alternative
 * https://github.com/parcel-bundler/lightningcss/blob/0c05ba8620f427e4a68bff05cfebe77bd35eef6f/node/index.d.ts#L310
 */

type GlobalReference = {
  type: 'global'
  name: string
}

type LocalReference = {
  type: 'local'
  name: string
}

export type DependencyReference = {
  type: 'dependency'
  specifier: string
  name: string
}

export type CSSModuleReferences = {
  [name: string]: DependencyReference
}

type ClassExport = {
  name: string
  composes: (LocalReference | GlobalReference | DependencyReference)[]
}

export type CSSModuleExports = Record<string, string | ClassExport>

export type CSSModuleData = {
  exports: CSSModuleExports
  references: CSSModuleReferences
}
