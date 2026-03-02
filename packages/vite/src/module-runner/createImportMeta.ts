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
  const isVirtual = modulePath.startsWith('data:application/javascript,')
  const href = isVirtual ? modulePath : posixPathToFileHref(modulePath)
  const filename = isVirtual ? undefined : modulePath
  const dirname = isVirtual ? undefined : posixDirname(modulePath)
  return {
    filename: isWindows && filename ? toWindowsPath(filename) : filename,
    dirname: isWindows && dirname ? toWindowsPath(dirname) : dirname,
    url: href,
    env: envProxy,
    resolve(_id: string, _parent?: string) {
      throw new Error('[module runner] "import.meta.resolve" is not supported.')
    },
    // should be replaced during transformation
    glob() {
      throw new Error(
        `[module runner] "import.meta.glob" is statically replaced during ` +
          `file transformation. Make sure to reference it by the full name.`,
      )
    },
    // @types/node adds `main` to `import.meta`, but we don't add that for the defaultImportMeta
  } satisfies Omit<ModuleRunnerImportMeta, 'main'> as any
}

/**
 * Create import.meta object for Node.js.
 */
export function createNodeImportMeta(
  modulePath: string,
): ModuleRunnerImportMeta {
  const defaultMeta = createDefaultImportMeta(modulePath)
  const href = defaultMeta.url

  const importMetaResolver = createImportMetaResolver()

  return {
    ...defaultMeta,
    main: false,
    resolve(id: string, parent?: string) {
      const resolver = importMetaResolver ?? defaultMeta.resolve
      return resolver(id, parent ?? href)
    },
  }
}
