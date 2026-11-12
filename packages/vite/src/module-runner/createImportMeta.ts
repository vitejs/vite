import { isWindows } from '../shared/utils'
import { createImportMetaResolver } from './importMetaResolver'
import type { ModuleRunnerImportMeta } from './types'
import { posixDirname, posixPathToFileHref, toWindowsPath } from './utils'

const envProxy = new Proxy({} as any, {
  get(_, p) {
    throw new Error(
      `[module runner] Dynamic access of "import.meta.env" is not supported. Please, use "import.meta.env.${String(p)}" instead.`,
    )
  },
})

export function createDefaultImportMeta(
  modulePath: string,
): ModuleRunnerImportMeta {
  const fileUrl = posixPathToFileHref(modulePath)
  const filename = modulePath
  const dirname = posixDirname(modulePath)
  return {
    filename: isWindows ? toWindowsPath(filename) : filename,
    dirname: isWindows ? toWindowsPath(dirname) : dirname,
    url: fileUrl,
    env: envProxy,
    resolve(_specifier: string, _parentUrl?: string) {
      throw new Error('[module runner] "import.meta.resolve" is not supported.')
    },
    // should be replaced during transformation
    glob() {
      throw new Error(
        `[module runner] "import.meta.glob" is statically replaced during ` +
          `file transformation. Make sure to reference it by the full name.`,
      )
    },
  }
}

/**
 * Create import.meta object for Node.js.
 */
export function createNodeImportMeta(
  modulePath: string,
): ModuleRunnerImportMeta {
  const defaultMeta = createDefaultImportMeta(modulePath)
  const fileUrl = defaultMeta.url

  const importMetaResolver = createImportMetaResolver()

  return {
    ...defaultMeta,
    main: false,
    resolve(specifier: string, parentUrl?: string) {
      const resolver = importMetaResolver ?? defaultMeta.resolve
      return resolver(specifier, parentUrl ?? fileUrl)
    },
  }
}
