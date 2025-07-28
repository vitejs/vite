export type ImportMetaResolver = (specifier: string, importer: string) => string

const customizationHookNamespace = 'vite-module-runner:import-meta-resolve/v1/'
const customizationHooksModule = /* js */ `

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(${JSON.stringify(customizationHookNamespace)})) {
    const data = specifier.slice(${JSON.stringify(customizationHookNamespace)}.length)
    const [parsedSpecifier, parsedImporter] = JSON.parse(data)
    specifier = parsedSpecifier
    context.parentURL = parsedImporter
  }

  return nextResolve(specifier, context)
}

`

export async function createImportMetaResolver(): Promise<
  ImportMetaResolver | undefined
> {
  let module: typeof import('node:module')
  try {
    module = (await import('node:module')).Module
  } catch {
    return
  }
  // `module.Module` may be `undefined` when `node:module` is mocked
  if (!module?.register) {
    return
  }

  try {
    const hookModuleContent = `data:text/javascript,${encodeURI(customizationHooksModule)}`
    module.register(hookModuleContent)
  } catch (e) {
    // For `--experimental-network-imports` flag that exists in Node before v22
    if ('code' in e && e.code === 'ERR_NETWORK_IMPORT_DISALLOWED') {
      return
    }
    throw e
  }

  return (specifier: string, importer: string) =>
    import.meta.resolve(
      `${customizationHookNamespace}${JSON.stringify([specifier, importer])}`,
    )
}
