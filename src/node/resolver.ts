import path from 'path'
import slash from 'slash'

export interface Resolver {
  requestToFile(publicPath: string, root: string): string | undefined
  fileToRequest(filePath: string, root: string): string | undefined
}

export interface InternalResolver {
  requestToFile(publicPath: string): string
  fileToRequest(filePath: string): string
}

const defaultrequestToFile = (publicPath: string, root: string) =>
  path.join(root, publicPath.slice(1))

const defaultfileToRequest = (filePath: string, root: string) =>
  `/${slash(path.relative(root, filePath))}`

export function createResolver(
  root: string,
  resolvers: Resolver[]
): InternalResolver {
  return {
    requestToFile: (publicPath) => {
      for (const r of resolvers) {
        const filepath = r.requestToFile(publicPath, root)
        if (filepath) return filepath
      }
      return defaultrequestToFile(publicPath, root)
    },
    fileToRequest: (filePath) => {
      for (const r of resolvers) {
        const filepath = r.fileToRequest(filePath, root)
        if (filepath) return filepath
      }
      return defaultfileToRequest(filePath, root)
    }
  }
}
