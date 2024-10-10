import path from 'node:path'
import glob from 'fast-glob'
import micromatch from 'micromatch'
import type { ResolvedConfig } from '../config'
import { escapeRegex, getNpmPackageName } from '../utils'
import { resolvePackageData } from '../packages'
import { slash } from '../../shared/utils'
import type { Environment } from '../environment'
import { createBackCompatIdResolver } from '../idResolver'

export function createOptimizeDepsIncludeResolver(
  environment: Environment,
): (id: string) => Promise<string | undefined> {
  const topLevelConfig = environment.getTopLevelConfig()
  const resolve = createBackCompatIdResolver(topLevelConfig, {
    asSrc: false,
    scan: true,
    ssrOptimizeCheck: environment.config.consumer === 'server',
    packageCache: new Map(),
  })
  return async (id: string) => {
    const lastArrowIndex = id.lastIndexOf('>')
    if (lastArrowIndex === -1) {
      return await resolve(environment, id, undefined)
    }
    // split nested selected id by last '>', for example:
    // 'foo > bar > baz' => 'foo > bar' & 'baz'
    const nestedRoot = id.substring(0, lastArrowIndex).trim()
    const nestedPath = id.substring(lastArrowIndex + 1).trim()
    const basedir = nestedResolveBasedir(
      nestedRoot,
      topLevelConfig.root,
      topLevelConfig.resolve.preserveSymlinks,
    )
    return await resolve(
      environment,
      nestedPath,
      path.resolve(basedir, 'package.json'),
    )
  }
}

/**
 * Expand the glob syntax in `optimizeDeps.include` to proper import paths
 */
export function expandGlobIds(id: string, config: ResolvedConfig): string[] {
  const pkgName = getNpmPackageName(id)
  if (!pkgName) return []

  const pkgData = resolvePackageData(
    pkgName,
    config.root,
    config.resolve.preserveSymlinks,
    config.packageCache,
  )
  if (!pkgData) return []

  const pattern = '.' + id.slice(pkgName.length)
  const exports = pkgData.data.exports

  // if package has exports field, get all possible export paths and apply
  // glob on them with micromatch
  if (exports) {
    if (typeof exports === 'string' || Array.isArray(exports)) {
      return [pkgName]
    }

    const possibleExportPaths: string[] = []
    for (const key in exports) {
      if (key[0] === '.') {
        if (key.includes('*')) {
          // "./glob/*": {
          //   "browser": "./dist/glob/*-browser/*.js", <-- get this one
          //   "default": "./dist/glob/*/*.js"
          // }
          // NOTE: theoretically the "default" condition could map to a different
          // set of files, but that complicates the resolve logic, so we assume
          // all conditions map to the same set of files, and get the first one.
          const exportsValue = getFirstExportStringValue(exports[key])
          if (!exportsValue) continue

          // "./dist/glob/*-browser/*.js" => "./dist/glob/**/*-browser/**/*.js"
          // NOTE: in some cases, this could expand to consecutive /**/*/**/* etc
          // but it's fine since fast-glob handles it the same.
          const exportValuePattern = exportsValue.replace(/\*/g, '**/*')
          // "./dist/glob/*-browser/*.js" => /dist\/glob\/(.*)-browser\/(.*)\.js/
          const exportsValueGlobRe = new RegExp(
            exportsValue.split('*').map(escapeRegex).join('(.*)'),
          )

          possibleExportPaths.push(
            ...glob
              .sync(exportValuePattern, {
                cwd: pkgData.dir,
                ignore: ['node_modules'],
              })
              .map((filePath) => {
                // ensure "./" prefix for inconsistent fast-glob result
                //   glob.sync("./some-dir/**/*") -> "./some-dir/some-file"
                //   glob.sync("./**/*")          -> "some-dir/some-file"
                if (
                  exportsValue.startsWith('./') &&
                  !filePath.startsWith('./')
                ) {
                  filePath = './' + filePath
                }

                // "./glob/*": "./dist/glob/*-browser/*.js"
                // `filePath`: "./dist/glob/foo-browser/foo.js"
                // we need to revert the file path back to the export key by
                // matching value regex and replacing the capture groups to the key
                const matched = exportsValueGlobRe.exec(slash(filePath))
                // `matched`: [..., 'foo', 'foo']
                if (matched) {
                  let allGlobSame = matched.length === 2
                  // exports key can only have one *, so for >=2 matched groups,
                  // make sure they have the same value
                  if (!allGlobSame) {
                    // assume true, if one group is different, set false and break
                    allGlobSame = true
                    for (let i = 2; i < matched.length; i++) {
                      if (matched[i] !== matched[i - 1]) {
                        allGlobSame = false
                        break
                      }
                    }
                  }
                  if (allGlobSame) {
                    return key.replace('*', matched[1]).slice(2)
                  }
                }
                return ''
              })
              .filter(Boolean),
          )
        } else {
          possibleExportPaths.push(key.slice(2))
        }
      }
    }

    const matched = micromatch(possibleExportPaths, pattern).map((match) =>
      path.posix.join(pkgName, match),
    )
    matched.unshift(pkgName)
    return matched
  } else {
    // for packages without exports, we can do a simple glob
    const matched = glob
      .sync(pattern, { cwd: pkgData.dir, ignore: ['node_modules'] })
      .map((match) => path.posix.join(pkgName, slash(match)))
    matched.unshift(pkgName)
    return matched
  }
}

function getFirstExportStringValue(
  obj: string | string[] | Record<string, any>,
): string | undefined {
  if (typeof obj === 'string') {
    return obj
  } else if (Array.isArray(obj)) {
    return obj[0]
  } else {
    for (const key in obj) {
      return getFirstExportStringValue(obj[key])
    }
  }
}

/**
 * Continuously resolve the basedir of packages separated by '>'
 */
function nestedResolveBasedir(
  id: string,
  basedir: string,
  preserveSymlinks = false,
) {
  const pkgs = id.split('>').map((pkg) => pkg.trim())
  for (const pkg of pkgs) {
    basedir = resolvePackageData(pkg, basedir, preserveSymlinks)?.dir || basedir
  }
  return basedir
}
