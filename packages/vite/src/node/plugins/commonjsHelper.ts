import type { Plugin } from '../plugin'

const HELPERS_ID = '/commonjs-helpers.js'
const RESOLVED_HELPERS_ID = '\0/commonjs-helpers.js'

interface HelperTool {
  getDefaultExportFromCjs?: PropertyDescriptor
  mergeNamespaces?: PropertyDescriptor
}
interface InteractiveInterface {
  importedName: keyof HelperTool
  localName: string
}
type HelperContainer = {
  needInject?: boolean
  compiler: (localName: string, importedName: string) => string
} & HelperTool
export interface CommonjsHelperContainerType {
  translate: (
    importedName: string,
    localName: string,
    cjsModuleName: string,
  ) => string
  injectHelper: () => string | null
}

const helperModule = `
	export const getDefaultExportFromCjs = (x) => {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}
	export const mergeNamespaces = (n, m) => {
		for (var i = 0; i < m.length; i++) {
			const e = m[i];
			if (typeof e !== 'string' && !Array.isArray(e)) { 
				for (const k in e) {
					if (k !== 'default' && !(k in n)) {
						const d = Object.getOwnPropertyDescriptor(e, k);
						if (d) {
							Object.defineProperty(n, k, d.get ? d : {
								enumerable: true,
								get: () => e[k]
							});
						}
					}
				} 
			}
		}
		return Object.freeze(Object.defineProperty(n, Symbol.toStringTag, { value: 'Module' }));
	}
`

const getLocalName = (importedName: keyof HelperTool) => {
  return `__${importedName}`
}
export class CommonjsHelperContainer implements CommonjsHelperContainerType {
  private _uniqueChecker = new Set<keyof HelperTool>()
  private _collectHelper = new Array<InteractiveInterface>()
  private _exposeHelperName = new Array<keyof HelperTool>(
    'mergeNamespaces',
    'getDefaultExportFromCjs',
  )
  private _helperContainer: Record<string, HelperContainer> = {
    '*': {
      compiler(localName, cjsModuleName) {
        return `const ${localName} = ${this.mergeNamespaces}({ __proto__: null, default: ${this.getDefaultExportFromCjs}(${cjsModuleName})}, [${cjsModuleName}]);`
      },
    },
    dynamic: {
      compiler(localName, importedName) {
        return `${localName} => ${this.mergeNamespaces}({
					__proto__: null,
					default: ${this.getDefaultExportFromCjs}(${importedName})
				}, [${importedName}])`
      },
    },
  }

  constructor() {
    this._init()
  }
  private _init(): void {
    const collect = this._collect.bind(this)
    Object.keys(this._helperContainer).forEach((importedName) => {
      const helper = this._helperContainer[importedName]
      Object.defineProperties(
        helper,
        Object.values(this._exposeHelperName).reduce(
          (accumulator, exposeImportedName) => {
            const importedName = exposeImportedName as keyof HelperTool
            const localName = getLocalName(importedName)
            accumulator[importedName] = {
              get() {
                const { needInject = true } = helper
                needInject && collect({ importedName, localName })
                return localName
              },
            }
            return accumulator
          },
          {} as PropertyDescriptorMap,
        ),
      )
    })
  }
  private _collect(helper: InteractiveInterface): void {
    if (this._uniqueChecker.has(helper.importedName)) return
    this._uniqueChecker.add(helper.importedName)
    this._collectHelper.push(helper)
  }
  translate(
    importedName: string,
    localName: string,
    cjsModuleName: string,
  ): string {
    const compilerHelper = this._helperContainer[importedName]
    if (compilerHelper) {
      return compilerHelper.compiler(localName, cjsModuleName)
    }
    return ''
  }
  injectHelper(): string | null {
    if (this._collectHelper.length) {
      return `import { ${[...this._collectHelper].map(
        ({ localName, importedName }) => `${importedName} as ${localName}`,
      )} } from "${HELPERS_ID}";`
    }
    return null
  }
}

export function commonjsHelperPlugin(): Plugin {
  return {
    name: 'vite:commonjs-helper',
    resolveId(id) {
      if (id === HELPERS_ID) {
        return RESOLVED_HELPERS_ID
      }
    },
    load(id) {
      if (id === RESOLVED_HELPERS_ID) {
        return helperModule
      }
    },
  }
}
