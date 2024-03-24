import colors from 'picocolors'
import { logRecentCommits, run, updateTemplateVersions } from './releaseUtils'
;(async () => {
  const { release } = await import('@vitejs/release-scripts')

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
        '.'
      ]
      if (pkgName !== 'vite') changelogArgs.push('--lerna-package', pkgName)
      await run('npx', changelogArgs, { cwd: `packages/${pkgName}` })
    }
  })
})()
