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

  if (!version.startsWith('v')) throw new Error('Invalid tag ' + tag)

  version = version.slice(1)

  const { currentVersion, pkgPath } = getPackageInfo(pkgName)
  if (currentVersion !== version)
    throw new Error(
      `Package version from tag "${version}" mismatches with current version "${currentVersion}"`
    )

  step('Publishing package...')
  await publishPackage(pkgPath, version.includes('beta') ? 'beta' : undefined)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
