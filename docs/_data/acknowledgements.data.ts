import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const vitePackageDir = path.resolve(__dirname, '../../packages/vite')

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
  dependencies: Dependency[]
  devDependencies: Dependency[]
  optionalDependencies: Dependency[]
  transitiveDependencies: Dependency[]
  notableDependencies: string[]
  pastNotableDependencies: PastDependency[]
  authors: Author[]
  transitiveAuthors: Author[]
}

// Notable dependencies to highlight (by package name)
const notableDependencies = [
  'esbuild',
  'rollup',
  'postcss',
  'lightningcss',
  'chokidar',
  'magic-string',
]

// Past notable dependencies that Vite used previously
const pastNotableDependencies: PastDependency[] = [
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

  // Handle shorthand like "github:user/repo"
  if (url.startsWith('github:')) {
    return `https://github.com/${url.slice(7)}`
  }

  // Handle shorthand like "user/repo" (GitHub shorthand)
  if (/^[^/]+\/[^/]+$/.test(url) && !url.includes(':')) {
    return `https://github.com/${url}`
  }

  // Normalize git URLs
  return url
    .replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/^ssh:\/\/git@github\.com/, 'https://github.com')
    .replace(/^git@github\.com:/, 'https://github.com/')
    .replace(/\.git$/, '')
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

  // Extract URL from parentheses at the end
  const urlMatch = str.match(/\(([^)]+)\)$/)
  if (urlMatch) {
    url = urlMatch[1]
    str = str.slice(0, urlMatch.index).trim()
  }

  // Remove email in angle brackets
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
  // Handle scoped packages
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

function getTransitiveDependencies(
  directDeps: Set<string>,
  nodeModulesDir: string,
  rootNodeModulesDir: string,
): Dependency[] {
  const visited = new Set<string>()
  const transitive: Dependency[] = []

  function visit(packageName: string, currentNodeModules: string) {
    if (visited.has(packageName)) return
    visited.add(packageName)

    // For pnpm, we need to follow the symlink to get the real package location
    const packageDir = path.join(currentNodeModules, packageName)
    let realPackageDir: string
    try {
      realPackageDir = fs.realpathSync(packageDir)
    } catch {
      return
    }

    const packageJsonPath = path.join(realPackageDir, 'package.json')

    try {
      const content = fs.readFileSync(packageJsonPath, 'utf-8')
      const pkg: PackageJson = JSON.parse(content)

      // In pnpm, deps are siblings in the same node_modules folder
      const pkgNodeModules = path.dirname(realPackageDir)

      // Process dependencies of this package
      const deps = { ...pkg.dependencies }
      for (const depName of Object.keys(deps)) {
        if (!directDeps.has(depName) && !visited.has(depName)) {
          // Try to read from package's own node_modules first, then root
          const depInfo =
            readPackageInfo(depName, pkgNodeModules) ||
            readPackageInfo(depName, rootNodeModulesDir)
          if (depInfo) {
            transitive.push(depInfo)
          }
          visit(depName, pkgNodeModules)
        }
      }
    } catch {
      // Package might not exist
    }
  }

  // Start from direct dependencies
  for (const dep of directDeps) {
    visit(dep, nodeModulesDir)
  }

  // Sort alphabetically and deduplicate
  const seen = new Set<string>()
  return transitive
    .filter((dep) => {
      if (seen.has(dep.name)) return false
      seen.add(dep.name)
      return true
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

function loadDependencies(
  names: string[],
  nodeModulesDir: string,
): Dependency[] {
  return names
    .map((name) => readPackageInfo(name, nodeModulesDir))
    .filter((dep) => dep != null)
    .sort((a, b) => a.name.localeCompare(b.name))
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
  const packageJsonPath = path.join(vitePackageDir, 'package.json')
  const packageJson: PackageJson = JSON.parse(
    fs.readFileSync(packageJsonPath, 'utf-8'),
  )

  const nodeModulesDir = path.join(vitePackageDir, 'node_modules')
  const rootNodeModulesDir = path.resolve(__dirname, '../../node_modules')

  const depNames = Object.keys(packageJson.dependencies || {})
  const devDepNames = Object.keys(packageJson.devDependencies || {})
  const optionalDepNames = Object.keys(packageJson.optionalDependencies || {})

  const dependencies = loadDependencies(depNames, nodeModulesDir)
  const devDependencies = loadDependencies(devDepNames, nodeModulesDir)
  const optionalDependencies = loadDependencies(
    optionalDepNames,
    nodeModulesDir,
  )

  const allDirectDeps = new Set([
    ...depNames,
    ...devDepNames,
    ...optionalDepNames,
  ])
  const transitiveDependencies = getTransitiveDependencies(
    allDirectDeps,
    nodeModulesDir,
    rootNodeModulesDir,
  )

  const nonNotableDeps = [...dependencies, ...devDependencies].filter(
    (d) => !notableDependencies.includes(d.name),
  )

  return {
    dependencies,
    devDependencies,
    optionalDependencies,
    transitiveDependencies,
    notableDependencies,
    pastNotableDependencies,
    authors: groupByAuthor(nonNotableDeps),
    transitiveAuthors: groupByAuthor(transitiveDependencies),
  }
}

// Export data for VitePress
declare const data: AcknowledgementsData
export { data }

export default {
  watch: ['../../packages/vite/package.json'],
  load(): AcknowledgementsData {
    return loadData()
  },
}
