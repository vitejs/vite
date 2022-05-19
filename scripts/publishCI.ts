import { args, getPackageInfo, publishPackage, step } from './releaseUtils'

async function main() {
  const tag = args._[0]

  if (!tag) {
    throw new Error('No tag specified')
  }

  let pkgName = 'vite'
  let version

  if (tag.includes('@')) [pkgName, version] = tag.split('@')
  else version = tag

  if (version.startsWith('v')) version = version.slice(1)

  const { currentVersion, pkgDir } = getPackageInfo(pkgName)
  if (currentVersion !== version)
    throw new Error(
      `Package version from tag "${version}" mismatches with current version "${currentVersion}"`
    )

  step('Publishing package...')
  const releaseTag = version.includes('beta')
    ? 'beta'
    : version.includes('alpha')
    ? 'alpha'
    : undefined
  await publishPackage(pkgDir, releaseTag)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
