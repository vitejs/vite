/**
 * modified from https://github.com/vuejs/core/blob/master/scripts/release.js
 */
import colors from 'picocolors'
import type { ExecaChildProcess, Options as ExecaOptions } from 'execa'
import execa from 'execa'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import prompts from 'prompts'
import type { ReleaseType } from 'semver'
import semver from 'semver'

const args = require('minimist')(process.argv.slice(2))

// For GitHub Actions use
// Regular release   : release --type next --quiet
// Start beta        : release --type (minor-beta|major-beta) --quiet
// Release from beta : release --type stable --quiet

const pkgDir = process.cwd()
const pkgPath = path.resolve(pkgDir, 'package.json')
const pkg: { name: string; version: string } = require(pkgPath)
const pkgName = pkg.name.replace(/^@vitejs\//, '')
const currentVersion = pkg.version
const isDryRun: boolean = args.dry
const skipBuild: boolean = args.skipBuild

const versionIncrements: ReleaseType[] = [
  'patch',
  'minor',
  'major',
  'prepatch',
  'preminor',
  'premajor',
  'prerelease'
]

const inc: (i: ReleaseType) => string = (i) =>
  semver.inc(currentVersion, i, 'beta')!

type RunFn = (
  bin: string,
  args: string[],
  opts?: ExecaOptions<string>
) => ExecaChildProcess<string>

const run: RunFn = (bin, args, opts = {}) =>
  execa(bin, args, { stdio: 'inherit', ...opts })

type DryRunFn = (bin: string, args: string[], opts?: any) => void

const dryRun: DryRunFn = (bin, args, opts: any) =>
  console.log(colors.blue(`[dryrun] ${bin} ${args.join(' ')}`), opts)

const runIfNotDry = isDryRun ? dryRun : run

const step: (msg: string) => void = (msg) => console.log(colors.cyan(msg))

async function main(): Promise<void> {
  let targetVersion: string | undefined = args._[0]

  if (!targetVersion) {
    const type: string | undefined = args.type
    if (type) {
      const currentBeta = !currentVersion.includes('beta')
      if (type === 'stable') {
        // Out of beta
        if (!currentBeta) {
          throw new Error(
            `Current version: ${currentVersion} isn't a beta, stable can't be used`
          )
        }
        targetVersion = inc('patch')
      } else if (type === 'minor-beta') {
        if (currentBeta) {
          throw new Error(
            `Current version: ${currentVersion} is already a beta, minor-beta can't be used`
          )
        }
        targetVersion = inc('preminor')
      } else if (type === 'major-beta') {
        if (currentBeta) {
          throw new Error(
            `Current version: ${currentVersion} is already a beta, major-beta can't be used`
          )
        }
        targetVersion = inc('premajor')
      } else if (type === 'next') {
        targetVersion = inc(currentBeta ? 'prerelease' : 'patch')
      } else {
        throw new Error(
          `type: ${type} isn't a valid type. Use stable, minor-beta, major-beta, or next`
        )
      }
    } else {
      // no explicit version or type, offer suggestions
      const { release }: { release: string } = await prompts({
        type: 'select',
        name: 'release',
        message: 'Select release type',
        choices: versionIncrements
          .map((i) => `${i} (${inc(i)})`)
          .concat(['custom'])
          .map((i) => ({ value: i, title: i }))
      })

      if (release === 'custom') {
        const res: { version: string } = await prompts({
          type: 'text',
          name: 'version',
          message: 'Input custom version',
          initial: currentVersion
        })
        targetVersion = res.version
      } else {
        targetVersion = release.match(/\((.*)\)/)![1]
      }
    }
  }

  if (!semver.valid(targetVersion)) {
    throw new Error(`invalid target version: ${targetVersion}`)
  }

  const tag =
    pkgName === 'vite' ? `v${targetVersion}` : `${pkgName}@${targetVersion}`

  if (!args.quiet) {
    if (targetVersion.includes('beta') && !args.tag) {
      const { tagBeta }: { tagBeta: boolean } = await prompts({
        type: 'confirm',
        name: 'tagBeta',
        message: `Publish under dist-tag "beta"?`
      })

      if (tagBeta) args.tag = 'beta'
    }

    const { yes }: { yes: boolean } = await prompts({
      type: 'confirm',
      name: 'yes',
      message: `Releasing ${tag}. Confirm?`
    })

    if (!yes) {
      return
    }
  } else {
    if (targetVersion.includes('beta') && !args.tag) {
      args.tag = 'beta'
    }
  }

  step('\nUpdating package version...')
  updateVersion(targetVersion)

  step('\nBuilding package...')
  if (!skipBuild && !isDryRun) {
    await run('pnpm', ['run', 'build'])
  } else {
    console.log(`(skipped)`)
  }

  step('\nGenerating changelog...')
  await run('pnpm', ['run', 'changelog'])

  const { stdout } = await run('git', ['diff'], { stdio: 'pipe' })
  if (stdout) {
    step('\nCommitting changes...')
    await runIfNotDry('git', ['add', '-A'])
    await runIfNotDry('git', ['commit', '-m', `release: ${tag}`])
    await runIfNotDry('git', ['tag', tag])
  } else {
    console.log('No changes to commit.')
  }

  step('\nPublishing package...')
  await publishPackage(targetVersion, runIfNotDry)

  step('\nPushing to GitHub...')
  await runIfNotDry('git', ['push', 'origin', `refs/tags/${tag}`])
  await runIfNotDry('git', ['push'])

  if (isDryRun) {
    console.log(`\nDry run finished - run git diff to see package changes.`)
  }

  console.log()
}

function updateVersion(version: string): void {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  pkg.version = version
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

async function publishPackage(
  version: string,
  runIfNotDry: RunFn | DryRunFn
): Promise<void> {
  const publicArgs = [
    'publish',
    '--no-git-tag-version',
    '--new-version',
    version,
    '--access',
    'public'
  ]
  if (args.tag) {
    publicArgs.push(`--tag`, args.tag)
  }
  try {
    // important: we still use Yarn 1 to publish since we rely on its specific
    // behavior
    await runIfNotDry('yarn', publicArgs, {
      stdio: 'pipe'
    })
    console.log(colors.green(`Successfully published ${pkgName}@${version}`))
  } catch (e: any) {
    if (e.stderr.match(/previously published/)) {
      console.log(colors.red(`Skipping already published: ${pkgName}`))
    } else {
      throw e
    }
  }
}

main().catch((err) => {
  console.error(err)
})
