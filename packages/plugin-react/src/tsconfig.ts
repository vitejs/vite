import path from 'path'
import { readJsonFile } from './fs'

export function findCompilerOption(fileName: string, optionKey: string): any {
  const { dirname, join, resolve } = path.posix.isAbsolute(fileName)
    ? path.posix
    : path.win32

  let parentDir = dirname(fileName)
  while (true) {
    let config = readJsonFile(join(parentDir, 'tsconfig.json'))
    while (config) {
      if (config.compilerOptions?.[optionKey] !== undefined) {
        return config.compilerOptions[optionKey]
      }
      if (!config.extends) {
        return
      }
      if (!config.extends.endsWith('.json')) {
        config.extends += '.json'
      }
      config = readJsonFile(resolve(parentDir, config.extends), true)
    }
    const grandParentDir = dirname(parentDir)
    if (grandParentDir !== parentDir) {
      parentDir = grandParentDir
    } else return
  }
}
