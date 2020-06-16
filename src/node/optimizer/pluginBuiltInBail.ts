import { Plugin } from 'rollup'
import { lookupFile } from '../utils'

export const createBuiltInBailPlugin = (): Plugin => {
  const isbuiltin = require('isbuiltin')

  return {
    name: 'vite:node-built-in-bail',
    resolveId(id, importer) {
      if (isbuiltin(id)) {
        let importingDep
        if (importer) {
          const pkg = JSON.parse(lookupFile(importer, ['package.json']) || `{}`)
          if (pkg.name) {
            importingDep = pkg.name
          }
        }
        const dep = importingDep
          ? `Dependency "${importingDep}"`
          : `A dependency`
        throw new Error(
          `${dep} is attempting to import Node built-in module "${id}". ` +
            `This will not work in a browser environment.`
        )
      }
      return null
    }
  }
}
