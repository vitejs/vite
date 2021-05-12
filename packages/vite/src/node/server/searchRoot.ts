import fs from 'fs'
import { dirname } from 'path'
import { join } from 'path'

// https://github.com/vitejs/vite/issues/2820#issuecomment-812495079
const ROOT_FILES = [
  // '.git',

  // https://pnpm.js.org/workspaces/
  'pnpm-workspace.yaml'

  // https://rushjs.io/pages/advanced/config_files/
  // 'rush.json',

  // https://nx.dev/latest/react/getting-started/nx-setup
  // 'workspace.json',
  // 'nx.json'
]

// npm: https://docs.npmjs.com/cli/v7/using-npm/workspaces#installing-workspaces
// yarn: https://classic.yarnpkg.com/en/docs/workspaces/#toc-how-to-use-it
function hasWorkspacePackageJSON(root: string): boolean {
  const path = join(root, 'package.json')
  try {
    fs.accessSync(path, fs.constants.R_OK)
  } catch {
    return false
  }
  const content = JSON.parse(fs.readFileSync(path, 'utf-8')) || {}
  return !!content.workspaces
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
export function searchForPackageRoot(current: string, root = current): string {
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
  root = searchForPackageRoot(current)
): string {
  if (hasRootFile(current)) return current
  if (hasWorkspacePackageJSON(current)) return current

  const dir = dirname(current)
  // reach the fs root
  if (!dir || dir === current) return root

  return searchForWorkspaceRoot(dir, root)
}
