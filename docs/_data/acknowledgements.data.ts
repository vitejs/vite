import fs from 'node:fs'
import path from 'node:path'

// Notable dependencies to highlight (by package name)
const notableDependencies = [
  'rolldown',
  'postcss',
  'lightningcss',
  'chokidar',
  'magic-string',
]

// Dev tools used for development
const devToolNames = [
  'eslint',
  'prettier',
  'typescript',
  'vitest',
  'playwright-chromium',
]

// Past notable dependencies that Vite used previously
const pastNotableDependencies: PastDependency[] = [
  {
    name: 'esbuild',
    description:
      'JavaScript/TypeScript bundler and minifier (now using Rolldown, Oxc, and LightningCSS)',
    repository: 'https://github.com/evanw/esbuild',
  },
  {
    name: 'rollup',
    description: 'ES module bundler (now using Rolldown)',
    repository: 'https://github.com/rollup/rollup',
  },
  {
    name: 'http-proxy',
    description: 'HTTP proxying (now using http-proxy-3)',
    repository: 'https://github.com/http-party/node-http-proxy',
  },
  {
    name: 'acorn',
    description: 'JavaScript parser',
    repository: 'https://github.com/acornjs/acorn',
  },
  {
    name: 'fast-glob',
    description: 'Fast glob matching (now using tinyglobby/fdir)',
    repository: 'https://github.com/mrmlnc/fast-glob',
  },
  {
    name: 'debug',
    description: 'Debug logging (now using obug)',
    repository: 'https://github.com/debug-js/debug',
  },
]

const vitePackageDir = path.resolve(import.meta.dirname, '../../packages/vite')

interface PackageJson {
  name: string
  version: string
  description?: string
  author?: string | { name: string; email?: string; url?: string }
  repository?: string | { type?: string; url?: string }
  funding?:
    | string
    | { url: string; type?: string }
    | Array<string | { url: string; type?: string }>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
}

export interface Dependency {
  name: string
  version: string
  description?: string
  author?: string
  authorUrl?: string
  repository?: string
  funding?: string
}

export interface PastDependency {
  name: string
  description: string
  repository: string
}

export interface AuthorPackage {
  name: string
  funding?: string
}

export interface Author {
  name: string
  url?: string
  funding?: string
  packages: AuthorPackage[]
}

export interface AcknowledgementsData {
  bundledDependencies: Dependency[]
  notableDependencies: Dependency[]
  devTools: Dependency[]
  pastNotableDependencies: PastDependency[]
  authors: Author[]
}

/**
 * Parse the LICENSE.md file to extract bundled dependency names.
 */
function parseBundledDependenciesFromLicense(licensePath: string): string[] {
  const content = fs.readFileSync(licensePath, 'utf-8')

  // Find the "# Bundled dependencies:" section and parse package names from ## headers
  const bundledSection = content.split('# Bundled dependencies:\n')[1]
  if (!bundledSection) return []

  // Match all ## headers which contain package names (comma-separated for grouped packages)
  const deps = [...bundledSection.matchAll(/^## (.+)$/gm)].flatMap((m) =>
    // Package names can be comma-separated (e.g., "## pkg1, pkg2, pkg3")
    m[1].split(',').map((n) => n.trim()),
  )
  return [...new Set(deps)]
}

function normalizeRepository(
  repo: PackageJson['repository'],
): string | undefined {
  if (!repo) return undefined

  let url: string
  if (typeof repo === 'string') {
    url = repo
  } else if (repo.url) {
    url = repo.url
  } else {
    return undefined
  }
  url = url
    .replace(/^git\+/, '')
    .replace(/\.git$/, '')
    .replace(/(^|\/)[^/]+?@/, '$1') // remove "user@" from "ssh://user@host.com:..."
    .replace(/(\.[^.]+?):/, '$1/') // change ".com:" to ".com/" from "ssh://user@host.com:..."
    .replace(/^git:\/\//, 'https://')
    .replace(/^ssh:\/\//, 'https://')
  if (url.startsWith('github:')) {
    return `https://github.com/${url.slice(7)}`
  } else if (url.startsWith('gitlab:')) {
    return `https://gitlab.com/${url.slice(7)}`
  } else if (url.startsWith('bitbucket:')) {
    return `https://bitbucket.org/${url.slice(10)}`
  } else if (!url.includes(':') && url.split('/').length === 2) {
    return `https://github.com/${url}`
  } else {
    return url.includes('://') ? url : `https://${url}`
  }
}

function normalizeFunding(funding: PackageJson['funding']): string | undefined {
  if (!funding) return undefined
  if (typeof funding === 'string') return funding
  if (Array.isArray(funding)) {
    const first = funding[0]
    if (typeof first === 'string') return first
    return first?.url
  }
  return funding.url
}

function parseAuthor(author: PackageJson['author']): {
  name?: string
  url?: string
} {
  if (!author) return {}
  if (typeof author === 'object') {
    return { name: author.name, url: author.url }
  }
  // Parse string format: "Name <email> (url)" or "Name (url)" or "Name <email>" or "Name"
  let str = author
  let url: string | undefined
  const urlMatch = str.match(/\(([^)]+)\)$/)
  if (urlMatch) {
    url = urlMatch[1]
    str = str.slice(0, urlMatch.index).trim()
  }
  const emailIndex = str.indexOf('<')
  if (emailIndex !== -1) {
    str = str.slice(0, emailIndex).trim()
  }
  return { name: str || author, url }
}

function readPackageInfo(
  packageName: string,
  nodeModulesDir: string,
): Dependency | null {
  const packagePath = path.join(nodeModulesDir, packageName, 'package.json')

  try {
    const content = fs.readFileSync(packagePath, 'utf-8')
    const pkg: PackageJson = JSON.parse(content)
    const authorInfo = parseAuthor(pkg.author)

    return {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      author: authorInfo.name,
      authorUrl: authorInfo.url,
      repository: normalizeRepository(pkg.repository),
      funding: normalizeFunding(pkg.funding),
    }
  } catch {
    // Package might not exist in node_modules (optional peer dep, etc.)
    return null
  }
}

function groupByAuthor(dependencies: Dependency[]): Author[] {
  const authorMap = new Map<
    string,
    { url?: string; packages: AuthorPackage[] }
  >()

  for (const dep of dependencies) {
    if (dep.author) {
      const existing = authorMap.get(dep.author)
      if (existing) {
        existing.packages.push({ name: dep.name, funding: dep.funding })
        if (!existing.url && dep.authorUrl) {
          existing.url = dep.authorUrl
        }
      } else {
        authorMap.set(dep.author, {
          url: dep.authorUrl,
          packages: [{ name: dep.name, funding: dep.funding }],
        })
      }
    }
  }

  return Array.from(authorMap.entries())
    .map(([name, info]) => {
      const sortedPackages = info.packages.sort((a, b) =>
        a.name.localeCompare(b.name),
      )
      const fundingUrls = new Set(
        sortedPackages.map((p) => p.funding).filter(Boolean),
      )
      const sharedFunding =
        fundingUrls.size === 1 ? [...fundingUrls][0] : undefined
      return {
        name,
        url: info.url,
        funding: sharedFunding,
        packages: sharedFunding
          ? sortedPackages.map((p) => ({ name: p.name }))
          : sortedPackages,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

function loadData(): AcknowledgementsData {
  const licensePath = path.join(vitePackageDir, 'LICENSE.md')
  const nodeModulesDir = path.join(vitePackageDir, 'node_modules')
  const rootNodeModulesDir = path.resolve(
    import.meta.dirname,
    '../../node_modules',
  )

  const bundledDepNames = parseBundledDependenciesFromLicense(licensePath)
  const bundledDependencies = bundledDepNames
    .map(
      (name) =>
        readPackageInfo(name, nodeModulesDir) ||
        readPackageInfo(name, rootNodeModulesDir),
    )
    .filter((dep) => dep != null)
    .sort((a, b) => a.name.localeCompare(b.name))

  const devTools = devToolNames
    .map((name) => readPackageInfo(name, rootNodeModulesDir))
    .filter((dep) => dep != null)
    .sort((a, b) => a.name.localeCompare(b.name))

  const notableDeps = notableDependencies
    .map(
      (name) =>
        readPackageInfo(name, nodeModulesDir) ||
        readPackageInfo(name, rootNodeModulesDir),
    )
    .filter((dep) => dep != null)

  const nonNotableDeps = bundledDependencies.filter(
    (d) => !notableDependencies.includes(d.name),
  )

  return {
    bundledDependencies,
    notableDependencies: notableDeps,
    devTools,
    pastNotableDependencies,
    authors: groupByAuthor(nonNotableDeps),
  }
}

// Export data for VitePress
declare const data: AcknowledgementsData
export { data }

export default {
  watch: ['../../packages/vite/LICENSE.md'],
  load(): AcknowledgementsData {
    return loadData()
  },
}
