import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from '../plugin'
import { isInNodeModules, sortObjectKeys } from '../utils'
import type { PackageCache } from '../packages'
import { findNearestMainPackageData } from '../packages'

export interface LicenseEntry {
  /**
   * Package name
   */
  name: string
  /**
   * Package version
   */
  version: string
  /**
   * SPDX license identifier (from package.json "license" field)
   */
  identifier?: string
  /**
   * License file text
   */
  text?: string
}

export interface LicenseOptions {
  /**
   * The output file name of the license file relative to the output directory.
   * Specify a path that ends with `.json` to output the raw JSON metadata.
   *
   * @default '.vite/license.md'
   */
  fileName: string
}

const licenseConfigDefaults = Object.freeze({
  fileName: '.vite/license.md',
} satisfies LicenseOptions)

// https://github.com/npm/npm-packlist/blob/53b2a4f42b7fef0f63e8f26a3ea4692e23a58fed/lib/index.js#L284-L286
const licenseFiles = [/^license/i, /^licence/i, /^copying/i]

export function licensePlugin(): Plugin {
  return {
    name: 'vite:license',

    async generateBundle(_, bundle) {
      const licenseOption = this.environment.config.build.license
      if (licenseOption === false) return

      const packageCache: PackageCache = new Map()
      // Track license via a key to its license entry.
      // A key consists of "name@version" of a package.
      const licenses: Record<string, LicenseEntry> = {}

      for (const file in bundle) {
        const chunk = bundle[file]
        if (chunk.type === 'asset') continue

        for (const moduleId of chunk.moduleIds) {
          if (moduleId.startsWith('\0') || !isInNodeModules(moduleId)) continue

          // Find the dependency package.json
          const pkgData = findNearestMainPackageData(
            path.dirname(moduleId),
            packageCache,
          )
          if (!pkgData) continue

          // Grab the package.json keys and check if already exists in the licenses
          const { name, version = '0.0.0', license } = pkgData.data
          const key = `${name}@${version}`
          if (licenses[key]) continue

          // If not, create a new license entry
          const entry: LicenseEntry = { name, version }
          if (license) {
            entry.identifier = license.trim()
          }
          const licenseFile = findLicenseFile(pkgData.dir)
          if (licenseFile) {
            entry.text = fs.readFileSync(licenseFile, 'utf-8').trim()
          }
          licenses[key] = entry
        }
      }

      const licenseEntries = Object.values(sortObjectKeys(licenses))
      const licenseOutputFileName =
        typeof licenseOption === 'object'
          ? licenseOption.fileName
          : licenseConfigDefaults.fileName

      // Emit as a JSON file
      if (licenseOutputFileName.endsWith('.json')) {
        this.emitFile({
          fileName: licenseOutputFileName,
          type: 'asset',
          source: JSON.stringify(licenseEntries, null, 2),
        })
        return
      }

      // Emit a license file as markdown
      const markdown = licenseEntryToMarkdown(licenseEntries)
      this.emitFile({
        fileName: licenseOutputFileName,
        type: 'asset',
        source: markdown,
      })
    },
  }
}

function licenseEntryToMarkdown(licenses: LicenseEntry[]) {
  if (licenses.length === 0) {
    return `\
# Licenses

The app does not bundle any dependencies with licenses.
`
  }

  let text = `\
# Licenses

The app bundles dependencies which contain the following licenses:
`
  for (const license of licenses) {
    const nameAndVersionText = `${license.name} - ${license.version}`
    const identifierText = license.identifier ? ` (${license.identifier})` : ''

    text += `\n## ${nameAndVersionText}${identifierText}\n`
    if (license.text) {
      text += `\n${license.text}\n`
    }
  }
  return text
}

function findLicenseFile(pkgDir: string) {
  const files = fs.readdirSync(pkgDir)
  const matchedFile = files.find((file) =>
    licenseFiles.some((re) => re.test(file)),
  )
  if (matchedFile) {
    return path.join(pkgDir, matchedFile)
  }
}
