import { ServerPlugin } from '.'
import { isImportRequest, isStaticAsset } from '../utils'
import { updateCss } from './serverPluginCss'
const usedAssetsSet = new Set<string>()
const usedInCssAssetsImporteeMap = new Map<string, Set<string>>()
const usedInCssAssetsImporterMap = new Map<string, Set<string>>()
const usedAssetsInImportSet = new Set<string>()

export const assetPathPlugin: ServerPlugin = ({
  app,
  root,
  watcher,
  resolver
}) => {
  app.use(async (ctx, next) => {
    if (isStaticAsset(ctx.path)) {
      usedAssetsSet.add(ctx.path)
      if (isImportRequest(ctx)) {
        usedAssetsInImportSet.add(ctx.path)
        ctx.type = 'js'
        ctx.body = `export default ${JSON.stringify(ctx.path)}`
        return
      }
    }
    return next()
  })

  watcher.on('change', (filePath) => {
    if (isStaticAsset(filePath)) {
      let publicPath = resolver.fileToRequest(filePath)
      if (publicPath.startsWith('/public')) {
        publicPath = publicPath.replace('/public', '')
      }

      // skip unused
      if (!usedAssetsSet.has(publicPath)) return

      // used inside css
      if (usedInCssAssetsImporterMap.has(publicPath)) {
        const importers = usedInCssAssetsImporterMap.get(publicPath)
        if (importers) {
          updateCss(importers, watcher, resolver)
        }
      }
      // used inside js `xxx?import`, it can update without reload `js` boundary
      // The value with inside js import assets is file path,
      // so it can be update with this because it's actually to be `<img src="xxx">`,
      // used inside html. eg. <img src="xxx">
      watcher.send({
        type: 'assets-update',
        timestamp: Date.now(),
        path: publicPath
      })
    }
  })
}

export function recordCssImportAssetsChain(
  cssFilePath: string,
  assetsFilePathSet: Set<string>
) {
  const preImportees = usedInCssAssetsImporteeMap.get(cssFilePath)
  // if import code change, should removed unused previous importee
  if (preImportees) {
    for (const preImportee of preImportees) {
      if (!assetsFilePathSet.has(preImportee)) {
        const importers = usedInCssAssetsImporterMap.get(preImportee)
        if (importers) {
          importers.delete(cssFilePath)
        }
      }
    }
  }

  assetsFilePathSet.forEach((assetFilePath) => {
    if (usedInCssAssetsImporterMap.has(assetFilePath)) {
      usedInCssAssetsImporterMap.get(assetFilePath)!.add(cssFilePath)
    } else {
      usedInCssAssetsImporterMap.set(assetFilePath, new Set([cssFilePath]))
    }
  })

  usedInCssAssetsImporteeMap.set(cssFilePath, assetsFilePathSet)
}
