import { styleText } from 'node:util'
import { release } from '@vitejs/release-scripts'
import { logRecentCommits, run, updateTemplateVersions } from './releaseUtils'
import extendCommitHash from './extendCommitHash'

release({
  repo: 'vite',
  packages: ['vite', 'create-vite', 'plugin-legacy'],
  toTag: (pkg, version) =>
    pkg === 'vite' ? `v${version}` : `${pkg}@${version}`,
  logChangelog: (pkg) => logRecentCommits(pkg),
  generateChangelog: async (pkgName) => {
    if (pkgName === 'create-vite') await updateTemplateVersions()

    console.log(styleText('cyan', '\nGenerating changelog...'))
    const changelogArgs = [
      'conventional-changelog',
      '-p',
      'angular',
      '-i',
      'CHANGELOG.md',
      '-s',
      '--commit-path',
      '.',
    ]
    if (pkgName !== 'vite') changelogArgs.push('--lerna-package', pkgName)
    await run('npx', changelogArgs, { cwd: `packages/${pkgName}` })
    // conventional-changelog generates links with short commit hashes, extend them to full hashes
    extendCommitHash(`packages/${pkgName}/CHANGELOG.md`)
  },
})
