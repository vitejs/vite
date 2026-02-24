import fs from 'node:fs'
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from 'node:path'
import picomatch from 'picomatch'
import { isFileReadable } from '../utils'

// https://github.com/vitejs/vite/issues/2820#issuecomment-812495079
const ROOT_FILES = [
  // '.git',

  // https://pnpm.io/workspaces/
  'pnpm-workspace.yaml',

  // https://rushjs.io/pages/advanced/config_files/
  // 'rush.json',

  // https://nx.dev/latest/react/getting-started/nx-setup
  // 'workspace.json',
  // 'nx.json',

  // https://github.com/lerna/lerna#lernajson
  'lerna.json',
]

// npm: https://docs.npmjs.com/cli/v7/using-npm/workspaces#installing-workspaces
// yarn: https://classic.yarnpkg.com/en/docs/workspaces/#toc-how-to-use-it
function getWorkspacePackagePatterns(root: string): string[] | undefined {
  const path = join(root, 'package.json')
  if (!isFileReadable(path)) {
    return undefined
  }
  try {
    const content = JSON.parse(fs.readFileSync(path, 'utf-8')) || {}
    if (Array.isArray(content.workspaces)) {
      return content.workspaces.filter(
        (workspace: unknown): workspace is string =>
          typeof workspace === 'string',
      )
    }

    if (Array.isArray(content.workspaces?.packages)) {
      return content.workspaces.packages.filter(
        (workspace: unknown) => typeof workspace === 'string',
      )
    }

    return undefined
  } catch {
    return undefined
  }
}

function getPnpmWorkspacePatterns(root: string): string[] | undefined {
  const path = join(root, 'pnpm-workspace.yaml')
  if (!isFileReadable(path)) {
    return undefined
  }

  try {
    const content = fs.readFileSync(path, 'utf-8')
    const lines = content.split(/\r?\n/)

    const packages: string[] = []
    let inPackages = false
    let packagesIndent = -1

    for (const rawLine of lines) {
      const withoutComment = rawLine.replace(/\s+#.*$/, '')
      const line = withoutComment.trimEnd()
      if (!line.trim()) continue

      const indent = withoutComment.length - withoutComment.trimStart().length
      const trimmed = withoutComment.trimStart()

      if (!inPackages) {
        if (trimmed === 'packages:' || trimmed === 'packages: []') {
          inPackages = true
          packagesIndent = indent
          if (trimmed === 'packages: []') {
            return []
          }
        }
        continue
      }

      if (indent <= packagesIndent) {
        break
      }

      if (!trimmed.startsWith('- ')) {
        continue
      }

      const pattern = trimmed.slice(2).trim()
      if (!pattern) continue

      const unquoted =
        (pattern.startsWith('"') && pattern.endsWith('"')) ||
        (pattern.startsWith("'") && pattern.endsWith("'"))
          ? pattern.slice(1, -1)
          : pattern

      packages.push(unquoted)
    }

    return packages.length ? packages : undefined
  } catch {
    return undefined
  }
}

function getWorkspacePackageBases(root: string, patterns: string[]): string[] {
  const bases = patterns
    .filter((pattern) => !pattern.startsWith('!'))
    .map((pattern) => {
      let { base } = picomatch.scan(pattern)
      if (!base || base === '.') {
        return root
      }

      if (basename(base).includes('.')) {
        base = dirname(base)
      }

      return resolve(root, base)
    })

  return [root, ...bases]
}

function getCommonAncestor(paths: string[]): string {
  if (!paths.length) {
    return ''
  }

  let ancestor = resolve(paths[0])
  for (const path of paths.slice(1).map((path) => resolve(path))) {
    while (ancestor !== dirname(ancestor)) {
      const relation = relative(ancestor, path)
      if (
        relation === '' ||
        (!relation.startsWith('..') && !isAbsolute(relation))
      ) {
        break
      }
      ancestor = dirname(ancestor)
    }
  }

  return ancestor
}

function getWorkspaceRoot(root: string): string | undefined {
  const patterns =
    getPnpmWorkspacePatterns(root) ?? getWorkspacePackagePatterns(root)
  if (!patterns?.length) {
    return undefined
  }

  const packageBases = getWorkspacePackageBases(root, patterns)
  return getCommonAncestor(packageBases)
}

function hasRootFile(root: string): boolean {
  return ROOT_FILES.some((file) => fs.existsSync(join(root, file)))
}

function hasPackageJSON(root: string) {
  const path = join(root, 'package.json')
  return fs.existsSync(path)
}

/**
 * Search up for the nearest `package.json`
 */
export function searchForPackageRoot(
  current: string,
  root: string = current,
): string {
  if (hasPackageJSON(current)) return current

  const dir = dirname(current)
  // reach the fs root
  if (!dir || dir === current) return root

  return searchForPackageRoot(dir, root)
}

/**
 * Search up for the nearest workspace root
 */
export function searchForWorkspaceRoot(
  current: string,
  root: string = searchForPackageRoot(current),
): string {
  const workspaceRoot = getWorkspaceRoot(current)
  if (workspaceRoot) return workspaceRoot
  if (hasRootFile(current)) return current

  const dir = dirname(current)
  // reach the fs root
  if (!dir || dir === current) return root

  return searchForWorkspaceRoot(dir, root)
}
