/**
 * Merges prerelease (alpha/beta/rc) changelog entries into a single stable
 * release section within a package's CHANGELOG.md.
 *
 * Usage:
 *   pnpm merge-changelog <package> <version>
 *
 * Example:
 *   pnpm merge-changelog vite 8.0.0
 *
 * This will find the `## [8.0.0]` header in packages/vite/CHANGELOG.md,
 * collect all entries from its prerelease versions (e.g. 8.0.0-beta.1,
 * 8.0.0-rc.0), deduplicate and reorder them by category, append a
 * "Beta Changelogs" section with links to each prerelease's tagged
 * changelog, and write the merged result back to the file.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const pkg = process.argv[2]
const version = process.argv[3]

if (!pkg || !version) {
  console.error('Usage: pnpm merge-changelog <package> <version>')
  process.exit(1)
}

const CATEGORY_ORDER = [
  '### ⚠ BREAKING CHANGES',
  '### Features',
  '### Bug Fixes',
  '### Performance Improvements',
  '### Documentation',
  '### Miscellaneous Chores',
  '### Code Refactoring',
  '### Tests',
]

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const versionHeaderRe = /^## (?:<small>)?\[/

function findReleaseHeaderIndex(lines: string[], version: string): number {
  const re = new RegExp(`^## (?:<small>)?\\[${escapeRegex(version)}\\]`)
  const idx = lines.findIndex((l) => re.test(l))
  if (idx === -1) {
    console.error(`Could not find header for version ${version}`)
    process.exit(1)
  }
  return idx
}

function findEndBoundary(
  lines: string[],
  startIdx: number,
  version: string,
): number {
  const prereleaseRe = new RegExp(
    `^## (?:<small>)?\\[${escapeRegex(version)}-(beta|alpha|rc)\\.\\d+\\]`,
  )
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (versionHeaderRe.test(lines[i]) && !prereleaseRe.test(lines[i])) {
      return i
    }
  }
  return lines.length
}

function parseCategories(releaseLines: string[]): Map<string, string[]> {
  const categories = new Map<string, string[]>()
  let currentCategory: string | null = null

  for (let i = 1; i < releaseLines.length; i++) {
    const line = releaseLines[i]
    if (versionHeaderRe.test(line)) {
      currentCategory = null
      continue
    }
    if (line.startsWith('### ')) {
      currentCategory = line.trim()
      if (!categories.has(currentCategory)) {
        categories.set(currentCategory, [])
      }
      continue
    }

    if (currentCategory && line.trim() !== '') {
      categories.get(currentCategory)!.push(line)
    }
  }

  return categories
}

function findPreviousStableVersion(lines: string[], startIdx: number): string {
  for (let i = startIdx; i < lines.length; i++) {
    const match = lines[i].match(/^## (?:<small>)?\[([^\]]+)\]/)
    if (match) {
      const v = match[1]
      if (!/alpha|beta|rc/.test(v)) {
        return v
      }
    }
  }
  return ''
}

function updateHeaderCompareLink(
  headerLine: string,
  prevStable: string,
  pkg: string,
  version: string,
): string {
  if (!prevStable) return headerLine
  const tagPrefix = pkg === 'vite' ? 'v' : `${pkg}@`
  return headerLine.replace(
    /compare\/[^)]+/,
    `compare/${tagPrefix}${prevStable}...${tagPrefix}${version}`,
  )
}

function collectPrereleaseHeaders(
  releaseLines: string[],
  pkg: string,
): string[] {
  const lines: string[] = []
  for (const line of releaseLines) {
    const match = line.match(
      /^## (?:<small>)?\[([^\]]+)\]\(([^)]+)\)(?: \((\d{4}-\d{2}-\d{2})\))?/,
    )
    if (!match) continue
    const [, ver, compareUrl, date] = match
    if (!/alpha|beta|rc/.test(ver)) continue

    const tagPrefix = pkg === 'vite' ? 'v' : `${pkg}@`
    const tag = `${tagPrefix}${ver}`
    const header = date
      ? `#### [${ver}](${compareUrl}) (${date})`
      : `#### [${ver}](${compareUrl})`
    lines.push(
      header,
      '',
      `See [${ver} changelog](https://github.com/vitejs/vite/blob/${tag}/packages/${pkg}/CHANGELOG.md)`,
      '',
    )
  }
  return lines
}

function buildOutputLines(
  headerLine: string,
  categories: Map<string, string[]>,
  prereleaseLines: string[],
): string[] {
  const hasUnknownCategories = [...categories.keys()].filter(
    (c) => !CATEGORY_ORDER.includes(c),
  )
  if (hasUnknownCategories.length > 0) {
    throw new Error(
      `Unknown categories found: ${hasUnknownCategories.join(', ')}`,
    )
  }

  const outputLines: string[] = [headerLine, '']
  for (const category of CATEGORY_ORDER) {
    const items = categories.get(category)
    if (items && items.length > 0) {
      outputLines.push(category, '')
      outputLines.push(...items)
      outputLines.push('')
    }
  }

  if (prereleaseLines.length > 0) {
    outputLines.push('### Beta Changelogs', '', ...prereleaseLines)
  }

  return outputLines
}

const filePath = path.resolve(
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  import.meta.dirname,
  `../packages/${pkg}/CHANGELOG.md`,
)
const content = await readFile(filePath, 'utf-8')
const lines = content.split('\n')

const releaseHeaderIdx = findReleaseHeaderIndex(lines, version)
const endIdx = findEndBoundary(lines, releaseHeaderIdx, version)
const releaseLines = lines.slice(releaseHeaderIdx, endIdx)

const categories = parseCategories(releaseLines)
const prereleaseLines = collectPrereleaseHeaders(releaseLines, pkg)
const prevStable = findPreviousStableVersion(lines, endIdx)
const headerLine = updateHeaderCompareLink(
  releaseLines[0],
  prevStable,
  pkg,
  version,
)
const outputLines = buildOutputLines(headerLine, categories, prereleaseLines)

const result = [
  ...lines.slice(0, releaseHeaderIdx),
  ...outputLines,
  ...lines.slice(endIdx),
].join('\n')

await writeFile(filePath, result, 'utf-8')
console.log(`Merged prerelease changelog sections for ${version} in ${pkg}`)
