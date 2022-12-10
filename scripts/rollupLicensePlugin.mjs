// @ts-check

import fs from 'node:fs'
import path from 'node:path'
import license from 'rollup-plugin-license'
import colors from 'picocolors'
import fg from 'fast-glob'
import resolve from 'resolve'

/**
 * @param {string} licenseFilePath
 * @param {string} licenseTitle
 * @param {string} packageName
 */
function licensePlugin(licenseFilePath, licenseTitle, packageName) {
  return license({
    thirdParty(dependencies) {
      // https://github.com/rollup/rollup/blob/master/build-plugins/generate-license-file.js
      // MIT Licensed https://github.com/rollup/rollup/blob/master/LICENSE-CORE.md
      const coreLicense = fs.readFileSync(
        new URL('../LICENSE', import.meta.url),
      )
      function sortLicenses(licenses) {
        let withParenthesis = []
        let noParenthesis = []
        licenses.forEach((license) => {
          if (/^\(/.test(license)) {
            withParenthesis.push(license)
          } else {
            noParenthesis.push(license)
          }
        })
        withParenthesis = withParenthesis.sort()
        noParenthesis = noParenthesis.sort()
        return [...noParenthesis, ...withParenthesis]
      }
      const licenses = new Set()
      const dependencyLicenseTexts = dependencies
        .sort(({ name: _nameA }, { name: _nameB }) => {
          const nameA = /** @type {string} */ (_nameA)
          const nameB = /** @type {string} */ (_nameB)
          return nameA > nameB ? 1 : nameB > nameA ? -1 : 0
        })
        .map(
          ({
            name,
            license,
            licenseText,
            author,
            maintainers,
            contributors,
            repository,
          }) => {
            let text = `## ${name}\n`
            if (license) {
              text += `License: ${license}\n`
            }
            const names = new Set()
            for (const person of [author, ...maintainers, ...contributors]) {
              const name = typeof person === 'string' ? person : person?.name
              if (name) {
                names.add(name)
              }
            }
            if (names.size > 0) {
              text += `By: ${Array.from(names).join(', ')}\n`
            }
            if (repository) {
              text += `Repository: ${
                typeof repository === 'string' ? repository : repository.url
              }\n`
            }
            if (!licenseText && name) {
              try {
                const pkgDir = path.dirname(
                  resolve.sync(path.join(name, 'package.json'), {
                    preserveSymlinks: false,
                  }),
                )
                const licenseFile = fg.sync(`${pkgDir}/LICENSE*`, {
                  caseSensitiveMatch: false,
                })[0]
                if (licenseFile) {
                  licenseText = fs.readFileSync(licenseFile, 'utf-8')
                }
              } catch {}
            }
            if (licenseText) {
              text +=
                '\n' +
                licenseText
                  .trim()
                  .replace(/(\r\n|\r)/g, '\n')
                  .split('\n')
                  .map((line) => `> ${line}`)
                  .join('\n') +
                '\n'
            }
            licenses.add(license)
            return text
          },
        )
        .join('\n---------------------------------------\n\n')
      const licenseText =
        `# ${licenseTitle}\n` +
        `${packageName} is released under the MIT license:\n\n` +
        coreLicense +
        `\n# Licenses of bundled dependencies\n` +
        `The published ${packageName} artifact additionally contains code with the following licenses:\n` +
        `${sortLicenses(licenses).join(', ')}\n\n` +
        `# Bundled dependencies:\n` +
        dependencyLicenseTexts
      const existingLicenseText = fs.readFileSync(licenseFilePath, 'utf8')
      if (existingLicenseText !== licenseText) {
        fs.writeFileSync(licenseFilePath, licenseText)
        console.warn(
          colors.yellow(
            '\nLICENSE.md updated. You should commit the updated file.\n',
          ),
        )
      }
    },
  })
}

export default licensePlugin
