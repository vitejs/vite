import path from 'node:path'
import { pathToFileURL } from 'node:url'

class VariableFactory {
  static readonly guid = '5aa6825e_dad8_4150_85cf_cc17535c2a89'
  make(name: string) {
    return `${name}_${VariableFactory.guid}`
  }
}
const variableFactory = new VariableFactory()

const VAR_IMPORT_META = variableFactory.make('importMeta')

export class ImportMetaShim {
  static getCodeReplacementDefinitions(): Record<string, string> {
    return {
      'import.meta': VAR_IMPORT_META,
    }
  }

  constructor(readonly filePath: string) {}

  getCode(): string {
    const dirname = JSON.stringify(path.dirname(this.filePath))
    const filePath = JSON.stringify(this.filePath)
    const fileBasename = JSON.stringify(path.basename(this.filePath))
    const fileUrl = JSON.stringify(pathToFileURL(this.filePath).href)

    const varProcess = variableFactory.make('process')
    const varModule = variableFactory.make('module')
    const varRequire = variableFactory.make('require')

    return `
      import * as ${varProcess} from 'node:process'
      import * as ${varModule} from 'node:module'
      const ${varRequire} = ${varModule}.createRequire(${filePath})

      const ${VAR_IMPORT_META} = {
        dir: ${dirname},
        dirname: ${dirname},
        filename: ${filePath},
        path: ${filePath},
        file: ${fileBasename},
        url: ${fileUrl},
        get env() { return ${varProcess}.env },
        resolve(...args) { return ${varRequire}.resolve(...args) },
        resolveSync(...args) { return ${varRequire}.resolveSync(...args) },
        require(...args) { return ${varRequire}(...args) },
        main: false,
      }
    `
  }
}
