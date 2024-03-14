import { makeLegalIdentifier } from '@rollup/pluginutils'

type ImportSpecifiers = Record<string /* exportName */, string /* importAs */>
export type Imports = Map<string /* filePath */, ImportSpecifiers>
export type Exports = Record<
  string,
  {
    code: string
    resolved: string
    exportAs: Set<string>
  }
>

const importStatement = (specifier: string | string[], source: string) =>
  `import ${
    Array.isArray(specifier) ? `{${specifier.join(',')}}` : specifier
  } from${JSON.stringify(source)};`

const importsToCode = (imports: Imports, stringNamedExports = false) =>
  Array.from(imports)
    .map(([file, importedAs], index) => {
      if (stringNamedExports) {
        return importStatement(
          Object.entries(importedAs).map(
            ([exportName, importAs]) =>
              `${JSON.stringify(exportName)} as ${importAs}`,
          ),
          file,
        )
      }

      const importDefault = `cssModule${index}`
      return `${importStatement(importDefault, file)}const {${Object.entries(
        importedAs,
      )
        .map(
          ([exportName, importAs]) =>
            `${JSON.stringify(exportName)}: ${importAs}`,
        )
        .join(',')}} = ${importDefault};`
    })
    .join('')

const exportsToCode = (exports: Exports, stringNamedExports = false) => {
  const variables = new Set<string>()
  const exportedVariables = Object.entries(exports).flatMap(
    ([exportName, { exportAs, code: value }]) => {
      const jsVariable = makeLegalIdentifier(exportName)
      variables.add(`const ${jsVariable} = \`${value}\`;`)

      return Array.from(exportAs).map((exportAsName) => {
        const exportNameSafe = makeLegalIdentifier(exportAsName)
        if (exportAsName !== exportNameSafe) {
          exportAsName = JSON.stringify(exportAsName)
        }
        return [jsVariable, exportAsName] as const
      })
    },
  )

  const namedExports = `export {${exportedVariables
    .map(([jsVariable, exportName]) =>
      jsVariable === exportName
        ? jsVariable
        : exportName[0] !== '"' || stringNamedExports
          ? `${jsVariable} as ${exportName}`
          : '',
    )
    .filter(Boolean)
    .join(',')}};`

  const defaultExports = `export default{${exportedVariables
    .map(([jsVariable, exportName]) =>
      jsVariable === exportName ? jsVariable : `${exportName}: ${jsVariable}`,
    )
    .join(',')}}`

  return `${Array.from(variables).join('')}${namedExports}${defaultExports}`
}

export const generateEsm = (
  imports: Imports,
  exports: Exports,
  stringNamedExports = false,
): string =>
  importsToCode(imports, stringNamedExports) +
  exportsToCode(exports, stringNamedExports)
