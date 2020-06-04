import { Plugin } from 'rollup'
import slash from 'slash'

export const createBuiltInBailPlugin = (): Plugin => {
  const isbuiltin = require('isbuiltin')

  return {
    name: 'vite:node-built-in-bail',
    resolveId(id, importer) {
      if (isbuiltin(id)) {
        let importingDep
        if (importer) {
          const match = slash(importer).match(
            /\/node_modules\/([^@\/][^\/]*|@[^\/]+\/[^\/]+)\//
          )
          if (match) {
            importingDep = match[1]
          }
        }
        const dep = importingDep
          ? `Dependency "${importingDep}"`
          : `A dependnecy`
        throw new Error(
          `${dep} is attempting to import Node built-in module "${id}". ` +
            `This will not work in a browser environment.`
        )
      }
      return null
    }
  }
}
