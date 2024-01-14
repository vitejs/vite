import type { Plugin } from '../plugin'

interface InteractiveInterface {
  localName: string
  importedName: string
}

interface PropertyDescriptor {
  configurable?: boolean
  enumerable?: boolean
  value?: any
  writable?: boolean
  get?(): any
  set?(v: any): void
}

interface HelperTool {
  getDefaultExportFromCjs?: PropertyDescriptor
  mergeNamespaces?: PropertyDescriptor
}
type HelperContainer = {
  init?: Record<keyof HelperTool, string>
  collect?: (helper: InteractiveInterface) => void
  compiler: (localName: string, importedName: string) => string
} & HelperTool

export interface commonjsHelperContainerType {
  collectTools: Array<InteractiveInterface>
  helperContainer: Record<string, HelperContainer>
  init: () => void
  collect: (helper: InteractiveInterface) => void
  translate: (
    importedName: string,
    localName: string,
    cjsModuleName: string,
  ) => string
  injectHelper: () => void
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
export class commonjsHelperContainer implements commonjsHelperContainerType {
  collectTools = new Array<InteractiveInterface>()
  uniqueChecker = new Map<string, Set<string>>()
  helperContainer: Record<string, HelperContainer> = {
    '*': {
      init: {
        mergeNamespaces: '__mergeNamespaces',
        getDefaultExportFromCjs: '__getDefaultExportFromCjs',
      },
      collect: this.collect.bind(this),
      compiler(localName, cjsModuleName) {
        return `const ${localName} = ${this.mergeNamespaces}({ __proto__: null, default: ${this.getDefaultExportFromCjs}(${cjsModuleName})}, [${cjsModuleName}]);`
      },
    },
    dynamic: {
      init: {
        mergeNamespaces: '__mergeNamespaces',
        getDefaultExportFromCjs: '__getDefaultExportFromCjs',
      },
      collect: this.collect.bind(this),
      compiler(localName, importedName) {
        return `${localName} => ${this.mergeNamespaces}({
					__proto__: null,
					default: ${this.getDefaultExportFromCjs}(${importedName})
				}, [${importedName}])`
      },
    },
  }
  constructor() {
    this.init()
  }
  init(): void {
    const collect = this.collect.bind(this)
    Object.keys(this.helperContainer).forEach((importedName) => {
      const helper = this.helperContainer[importedName]
      if (helper.init) {
        Object.defineProperties(
          helper,
          Object.keys(helper.init).reduce(
            (accumulator, helperToolImportedName) => {
              const helperToolLocalName =
                helper.init![helperToolImportedName as keyof HelperTool]
              accumulator[helperToolImportedName] = {
                get() {
                  collect({
                    localName: helperToolLocalName,
                    importedName: helperToolImportedName,
                  })
                  return helperToolLocalName
                },
              }
              return accumulator
            },
            {} as PropertyDescriptorMap,
          ),
        )
      }
    })
  }
  collect(helper: InteractiveInterface): void {
    if (!this.uniqueChecker.get(helper.importedName)) {
      this.uniqueChecker.set(helper.importedName, new Set())
    }
    const checker = this.uniqueChecker.get(helper.importedName)
    if (checker?.has(helper.localName)) {
      return
    }
    checker?.add(helper.localName)
    this.collectTools.push(helper)
  }
  translate(
    importedName: string,
    localName: string,
    cjsModuleName: string,
  ): string {
    const compilerHelper = this.helperContainer[importedName]
    if (compilerHelper) {
      return compilerHelper.compiler(localName, cjsModuleName)
    }
    return ''
  }
  injectHelper(): string {
    if (this.collectTools.length) {
      return `import { ${[...this.collectTools].map(
        ({ localName, importedName }) => `${importedName} as ${localName}`,
      )} } from "${HELPERS_ID}";`
    }
    return ''
  }
}

const HELPERS_ID = '/commonjs-helpers.js'
const RESOLVED_HELPERS_ID = '\0/commonjs-helpers.js'

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
