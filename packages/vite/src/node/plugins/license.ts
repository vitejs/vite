import fs from 'node:fs'
import path from 'node:path'
import { cleanUrl } from '../../shared/utils'
import type { PackageCache } from '../packages'
import { findNearestMainPackageData } from '../packages'
import type { Plugin } from '../plugin'
import { isInNodeModules, sortObjectKeys } from '../utils'
import { cssDepsCache, removedPureCssFilesCache } from './css'
import { getWorkerModuleIds } from './worker'

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

    generateBundle(_, bundle) {
      const licenseOption = this.environment.config.build.license
      if (licenseOption === false) return

      const topLevelConfig = this.environment.getTopLevelConfig()
      const packageCache: PackageCache = new Map()
      // Track license via a key to its license entry.
      // A key consists of "name@version" of a package.
      const licenses: Record<string, LicenseEntry> = {}

      function addLicense(moduleId: string) {
        if (moduleId.startsWith('\0') || !isInNodeModules(moduleId)) return

        // Find the dependency package.json
        const pkgData = findNearestMainPackageData(
          path.dirname(moduleId),
          packageCache,
        )
        if (!pkgData) return

        // Grab the package.json keys and check if already exists in the licenses
        // oxlint-disable-next-line typescript/no-useless-default-assignment -- version might be actually missing
        const { name, version = '0.0.0', license } = pkgData.data
        const key = `${name}@${version}`
        if (licenses[key]) return

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

      const cssDeps = cssDepsCache.get(topLevelConfig)
      const visitedModules = new Set<string>()

      function processModule(moduleId: string) {
        if (visitedModules.has(moduleId)) return
        visitedModules.add(moduleId)

        addLicense(moduleId)

        // If this module has CSS dependencies (e.g. from @import or CSS preprocessor),
        // include them as well.
        const deps = cssDeps?.get(moduleId) ?? cssDeps?.get(cleanUrl(moduleId))
        if (deps) {
          for (const dep of deps) {
            processModule(dep)
          }
        }
      }

      for (const file in bundle) {
        const chunk = bundle[file]
        if (chunk.type === 'asset') {
          const files = chunk.originalFileNames?.length
            ? chunk.originalFileNames
            : chunk.originalFileName
              ? [chunk.originalFileName]
              : []
          for (const originalFile of files) {
            if (originalFile) {
              processModule(originalFile)
            }
          }
          continue
        }

        for (const moduleId of chunk.moduleIds) {
          processModule(moduleId)
        }
      }

      // Process pure CSS chunks whose JS placeholders were removed from the bundle
      const removedPureCssFiles = removedPureCssFilesCache.get(topLevelConfig)
      if (removedPureCssFiles) {
        for (const chunk of removedPureCssFiles.values()) {
          for (const moduleId of chunk.moduleIds) {
            processModule(moduleId)
          }
        }
      }

      // Process worker sub-build modules
      const workerModuleIds = getWorkerModuleIds(this.environment)
      if (workerModuleIds) {
        for (const moduleId of workerModuleIds) {
          processModule(moduleId)
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
