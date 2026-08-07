import fs from 'node:fs'
import path from 'node:path'

const pkgName = process.argv[2]
const tagName = process.argv[3]
const outputPath = process.argv[4]

if (!pkgName || !tagName || !outputPath) {
  console.error(
    'Usage: node extractReleaseNotes.js <pkgName> <tagName> <outputPath>',
  )
  process.exit(1)
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function resolveRelativePath(pkgName, relativePath) {
  const parts = `packages/${pkgName}/${relativePath}`.split('/')
  const stack = []
  for (const part of parts) {
    if (part === '.' || part === '') continue
    if (part === '..') {
      if (stack.length > 0) stack.pop()
    } else {
      stack.push(part)
    }
  }
  return stack.join('/')
}

try {
  let version = tagName
  if (pkgName === 'vite') {
    if (version.startsWith('v')) {
      version = version.slice(1)
    }
  } else {
    if (version.includes('@')) {
      version = version.split('@').pop()
    }
  }

  const changelogPath = path.resolve(`packages/${pkgName}/CHANGELOG.md`)
  if (!fs.existsSync(changelogPath)) {
    throw new Error(
      `CHANGELOG.md not found for package ${pkgName} at ${changelogPath}`,
    )
  }

  const content = fs.readFileSync(changelogPath, 'utf-8')
  const lines = content.split('\n')

  const re = new RegExp(`^## (?:<small>)?\\[${escapeRegex(version)}\\]`)
  let idx = lines.findIndex((l) => re.test(l))
  if (idx === -1) {
    // Try fallback check (e.g. without brackets, or matching any heading starting with version)
    const fallbackRe = new RegExp(
      `^## (?:<small>)?\\[?${escapeRegex(version)}\\]?`,
    )
    idx = lines.findIndex((l) => fallbackRe.test(l))
  }

  let releaseNotes = ''
  const changelogUrl = `https://github.com/vitejs/vite/blob/${tagName}/packages/${pkgName}/CHANGELOG.md`

  if (idx !== -1) {
    // Find where this version's section ends (the next version header)
    let endIdx = lines.length
    for (let i = idx + 1; i < lines.length; i++) {
      if (/^## (?:<small>)?(?:\[|\d)/.test(lines[i])) {
        endIdx = i
        break
      }
    }

    const sectionLines = lines.slice(idx + 1, endIdx)
    // Trim empty lines at start and end
    while (sectionLines.length > 0 && sectionLines[0].trim() === '') {
      sectionLines.shift()
    }
    while (
      sectionLines.length > 0 &&
      sectionLines[sectionLines.length - 1].trim() === ''
    ) {
      sectionLines.pop()
    }

    let rawBody = sectionLines.join('\n')

    // Rewrite relative markdown links/images to absolute links
    const relativeRegex = /(!?)\[([^\]]+)\]\(([^)]+)\)/g
    rawBody = rawBody.replace(relativeRegex, (match, isImage, text, url) => {
      if (
        url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('mailto:') ||
        url.startsWith('#')
      ) {
        return match
      }
      const resolvedPath = resolveRelativePath(pkgName, url)
      const absoluteUrl = `https://github.com/vitejs/vite/blob/${tagName}/${resolvedPath}`
      return `${isImage}[${text}](${absoluteUrl})`
    })

    releaseNotes =
      rawBody +
      `\n\n---\n\nPlease refer to [CHANGELOG.md](${changelogUrl}) for details.`
  } else {
    // Fallback if version not found in CHANGELOG.md
    releaseNotes = `Please refer to [CHANGELOG.md](${changelogUrl}) for details.`
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, releaseNotes, 'utf-8')
  console.log(`Successfully extracted release notes to ${outputPath}`)
} catch (err) {
  console.error('Error extracting release notes:', err)
  // Fallback to minimal file so release tag step still completes
  const fallbackUrl = `https://github.com/vitejs/vite/blob/${tagName}/packages/${pkgName}/CHANGELOG.md`
  const fallbackContent = `Please refer to [CHANGELOG.md](${fallbackUrl}) for details.`
  fs.writeFileSync(outputPath, fallbackContent, 'utf-8')
  process.exit(0) // exit 0 to not break CI
}
