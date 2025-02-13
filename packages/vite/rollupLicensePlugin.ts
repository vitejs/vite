import fs from 'node:fs'
import license from 'rollup-plugin-license'
import type { Dependency } from 'rollup-plugin-license'
import colors from 'picocolors'
import type { Plugin } from 'rollup'

export default function licensePlugin(
  licenseFilePath: string,
  licenseTitle: string,
  packageName: string,
  additionalSection?: string,
): Plugin {
  return license({
    thirdParty(dependencies) {
      // https://github.com/rollup/rollup/blob/master/build-plugins/generate-license-file.js
      // MIT Licensed https://github.com/rollup/rollup/blob/master/LICENSE-CORE.md
      const coreLicense = fs.readFileSync(
        new URL('../../LICENSE', import.meta.url),
      )

      const deps = sortDependencies(dependencies)
      const licenses = sortLicenses(
        new Set(
          dependencies.map((dep) => dep.license).filter(Boolean) as string[],
        ),
      )

      let dependencyLicenseTexts = ''
      for (let i = 0; i < deps.length; i++) {
        // Find dependencies with the same license text so it can be shared
        const licenseText = deps[i].licenseText
        const sameDeps = [deps[i]]
        if (licenseText) {
          for (let j = i + 1; j < deps.length; j++) {
            if (licenseText === deps[j].licenseText) {
              sameDeps.push(...deps.splice(j, 1))
              j--
            }
          }
        }

        let text = `## ${sameDeps.map((d) => d.name).join(', ')}\n`
        const depInfos = sameDeps.map((d) => getDependencyInformation(d))

        // If all same dependencies have the same license and contributor names, show them only once
        if (
          depInfos.length > 1 &&
          depInfos.every(
            (info) =>
              info.license === depInfos[0].license &&
              info.names === depInfos[0].names,
          )
        ) {
          const { license, names } = depInfos[0]
          const repositoryText = depInfos
            .map((info) => info.repository)
            .filter(Boolean)
            .join(', ')

          if (license) text += `License: ${license}\n`
          if (names) text += `By: ${names}\n`
          if (repositoryText) text += `Repositories: ${repositoryText}\n`
        }
        // Else show each dependency separately
        else {
          for (let j = 0; j < depInfos.length; j++) {
            const { license, names, repository } = depInfos[j]

            if (license) text += `License: ${license}\n`
            if (names) text += `By: ${names}\n`
            if (repository) text += `Repository: ${repository}\n`
            if (j !== depInfos.length - 1) text += '\n'
          }
        }

        if (licenseText) {
          text +=
            '\n' +
            licenseText
              .trim()
              .replace(/\r\n|\r/g, '\n')
              .split('\n')
              .map((line) => `> ${line}`)
              .join('\n') +
            '\n'
        }

        if (i !== deps.length - 1) {
          text += '\n---------------------------------------\n\n'
        }

        dependencyLicenseTexts += text
      }

      const licenseText =
        `# ${licenseTitle}\n` +
        `${packageName} is released under the MIT license:\n\n` +
        coreLicense +
        `\n` +
        (additionalSection || '') +
        `# Licenses of bundled dependencies\n` +
        `The published ${packageName} artifact additionally contains code with the following licenses:\n` +
        `${licenses.join(', ')}\n\n` +
        `# Bundled dependencies:\n` +
        dependencyLicenseTexts

      const existingLicenseText = fs.readFileSync(licenseFilePath, 'utf-8')
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

function sortDependencies(dependencies: Dependency[]) {
  return dependencies.sort(({ name: nameA }, { name: nameB }) => {
    return nameA! > nameB! ? 1 : nameB! > nameA! ? -1 : 0
  })
}

function sortLicenses(licenses: Set<string>) {
  let withParenthesis: string[] = []
  let noParenthesis: string[] = []
  licenses.forEach((license) => {
    if (license[0] === '(') {
      withParenthesis.push(license)
    } else {
      noParenthesis.push(license)
    }
  })
  withParenthesis = withParenthesis.sort()
  noParenthesis = noParenthesis.sort()
  return [...noParenthesis, ...withParenthesis]
}

interface DependencyInfo {
  license?: string
  names?: string
  repository?: string
}

function getDependencyInformation(dep: Dependency): DependencyInfo {
  const info: DependencyInfo = {}
  const { license, author, maintainers, contributors, repository } = dep

  if (license) {
    info.license = license
  }

  const names = new Set<string>()
  for (const person of [author, ...maintainers, ...contributors]) {
    const name = typeof person === 'string' ? person : person?.name
    if (name) {
      names.add(name)
    }
  }
  if (names.size > 0) {
    info.names = Array.from(names).join(', ')
  }

  if (repository) {
    info.repository =
      typeof repository === 'string' ? repository : repository.url
  }

  return info
}
