/* eslint-disable n/no-unsupported-features/node-builtins */

import type { ResolveFnOutput, ResolveHookContext } from 'node:module'

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
function customizationHookResolve(
  specifier: string,
  context: ResolveHookContext,
  nextResolve: (
    specifier: string,
    context: ResolveHookContext,
  ) => ResolveFnOutput,
): ResolveFnOutput {
  if (specifier.startsWith(customizationHookNamespace)) {
    const data = specifier.slice(customizationHookNamespace.length)
    const [parsedSpecifier, parsedImporter] = JSON.parse(data)
    specifier = parsedSpecifier
    context.parentURL = parsedImporter
  }
  return nextResolve(specifier, context)
}

export function createImportMetaResolver(): ImportMetaResolver | undefined {
  let module: typeof import('node:module')
  try {
    module = process.getBuiltinModule('node:module').Module
  } catch {
    return
  }
  // `module.Module` may be `undefined` when `node:module` is mocked
  if (!module) {
    return
  }

  // Use registerHooks if available as it's more performant
  if (module.registerHooks) {
    module.registerHooks({ resolve: customizationHookResolve })
    return importMetaResolveWithCustomHook
  }

  if (!module.register) {
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

  return importMetaResolveWithCustomHook
}

function importMetaResolveWithCustomHook(
  specifier: string,
  importer: string,
): string {
  return import.meta.resolve(
    `${customizationHookNamespace}${JSON.stringify([specifier, importer])}`,
  )
}

// NOTE: use computed string to avoid `define` replacing `import.meta.resolve` when bundled
export const importMetaResolveWithCustomHookString: string = /* js */ `

  (() => {
    const resolve = 'resolve'
    return (specifier, importer) =>
      import.meta[resolve](
        \`${customizationHookNamespace}\${JSON.stringify([specifier, importer])}\`,
      )
  })()

`
