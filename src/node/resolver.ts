import path from 'path'

export interface Resolver {
  publicToFile(publicPath: string, root: string): string | undefined
  fileToPublic(filePath: string, root: string): string | undefined
}

export interface InternalResolver {
  publicToFile(publicPath: string): string
  fileToPublic(filePath: string): string
}

const defaultPublicToFile = (publicPath: string, root: string) =>
  path.join(root, publicPath.slice(1))

const defaultFileToPublic = (filePath: string, root: string) =>
  `/${path.relative(root, filePath)}`

export function createResolver(
  root: string,
  resolvers: Resolver[]
): InternalResolver {
  return {
    publicToFile: (publicPath) => {
      for (const r of resolvers) {
        const filepath = r.publicToFile(publicPath, root)
        if (filepath) return filepath
      }
      return defaultPublicToFile(publicPath, root)
    },
    fileToPublic: (filePath) => {
      for (const r of resolvers) {
        const filepath = r.fileToPublic(filePath, root)
        if (filepath) return filepath
      }
      return defaultFileToPublic(filePath, root)
    }
  }
}
