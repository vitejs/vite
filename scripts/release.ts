import { release } from '@vitejs/release-scripts'
import colors from 'picocolors'
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

    console.log(colors.cyan('\nGenerating changelog...'))
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
  })  .then(() => {
  console.log(colors.green('\nRelease process completed successfully!'))
})
  .catch((error) => {
    console.error(colors.red('\nRelease process failed!'), error)
    process.exit(1)
  })
  .finally(() => {
    console.log(colors.cyan('\nCleaning up...'))
    // Clean up any temporary files or states if necessary
    // This is a placeholder for any cleanup logic you might need
  });                                                                                                                                                                                                                                                               
// This script is used to automate the release process for Vite and its related packages.
      // It handles generating changelogs, updating package versions, and publishing to npm.                            