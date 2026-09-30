import { extractChangelogEntry } from '@vitejs/release-scripts'

const [path, version] = process.argv.slice(2)
if (!path || !version) {
  throw new Error('Usage: node scripts/extract-changelog.ts <path> <version>')
}

const notes = extractChangelogEntry({ changelogPath: path, version })
process.stdout.write(`${notes}\n`)
