import {
  generateChangelog,
  getReleaseTag,
  prepareRelease,
} from '@vitejs/release-scripts'
import { releasePackages, updateTemplateVersions } from './releaseUtils.ts'

const { tag, version } = await prepareRelease({
  packages: releasePackages,
  pkg: process.argv[2],
  release: process.argv[3],
  toTag: (pkg, version) => getReleaseTag(pkg, version, 'vite'),
  generateChangelog: async (pkg) => {
    if (pkg === 'create-vite') await updateTemplateVersions()

    await generateChangelog({
      getPkgDir: () => `packages/${pkg}`,
      tagPrefix: pkg === 'vite' ? undefined : `${pkg}@`,
    })
  },
})

console.log(`tag=${tag}\nversion=${version}`)
