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

  const result = await nextResolve(specifier, context)
  return {
    ...result,
    shortCircuit: true,
  }
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
  if (!module.register) {
    return
  }

  const hookModuleContent = `data:text/javascript,${encodeURI(customizationHooksModule)}`
  module.register(hookModuleContent)

  return (specifier: string, importer: string) =>
    import.meta.resolve(
      `${customizationHookNamespace}${JSON.stringify([specifier, importer])}`,
    )
}
