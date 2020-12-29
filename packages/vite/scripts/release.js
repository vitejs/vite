/**
 * modified from https://github.com/vuejs/vue-next/blob/master/scripts/release.js
 */
const execa = require('execa')
const path = require('path')
const fs = require('fs')
const args = require('minimist')(process.argv.slice(2))
const semver = require('semver')
const chalk = require('chalk')
const { prompt } = require('enquirer')
const currentVersion = require('../package.json').version
const pkgPath = path.resolve(__dirname, '../package.json')

const isDryRun = args.dry
const skipBuild = args.skipBuild

const versionIncrements = [
  'patch',
  'minor',
  'major',
  'prepatch',
  'preminor',
  'premajor',
  'prerelease'
]

const inc = (i) => semver.inc(currentVersion, i)
const run = (bin, args, opts = {}) =>
  execa(bin, args, { stdio: 'inherit', ...opts })
const dryRun = (bin, args, opts = {}) =>
  console.log(chalk.blue(`[dryrun] ${bin} ${args.join(' ')}`), opts)
const runIfNotDry = isDryRun ? dryRun : run
const step = (msg) => console.log(chalk.cyan(msg))

async function main() {
  let targetVersion = args._[0]

  if (!targetVersion) {
    // no explicit version, offer suggestions
    const { release } = await prompt({
      type: 'select',
      name: 'release',
      message: 'Select release type',
      choices: versionIncrements
        .map((i) => `${i} (${inc(i)})`)
        .concat(['custom'])
    })

    if (release === 'custom') {
      targetVersion = (
        await prompt({
          type: 'input',
          name: 'version',
          message: 'Input custom version',
          initial: currentVersion
        })
      ).version
    } else {
      targetVersion = release.match(/\((.*)\)/)[1]
    }
  }

  if (!semver.valid(targetVersion)) {
    throw new Error(`invalid target version: ${targetVersion}`)
  }

  const { yes } = await prompt({
    type: 'confirm',
    name: 'yes',
    message: `Releasing v${targetVersion}. Confirm?`
  })

  if (!yes) {
    return
  }

  step('\nUpdating package version...')
  updateVersion(targetVersion)

  step('\nBuilding package...')
  if (!skipBuild && !isDryRun) {
    await run('yarn', ['build'])
  } else {
    console.log(`(skipped)`)
  }

  step('\nGenerating changelog...')
  await run('yarn', ['changelog'])

  const { stdout } = await run('git', ['diff'], { stdio: 'pipe' })
  if (stdout) {
    step('\nCommitting changes...')
    await runIfNotDry('git', ['add', '-A'])
    await runIfNotDry('git', ['commit', '-m', `release: v${targetVersion}`])
  } else {
    console.log('No changes to commit.')
  }

  step('\nPublishing package...')
  await publishPackage(targetVersion, runIfNotDry)

  step('\nPushing to GitHub...')
  await runIfNotDry('git', ['tag', `v${targetVersion}`])
  await runIfNotDry('git', ['push', 'origin', `refs/tags/v${targetVersion}`])
  await runIfNotDry('git', ['push'])

  if (isDryRun) {
    console.log(`\nDry run finished - run git diff to see package changes.`)
  }

  console.log()
}

function updateVersion(version) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  pkg.version = version
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

async function publishPackage(version, runIfNotDry) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  const pkgName = pkg.name
  const publicArgs = ['publish', '--new-version', version, '--access', 'public']
  if (args.tag) {
    publicArgs.push(`--tag`, args.tag)
  }
  try {
    await runIfNotDry('yarn', publicArgs, {
      stdio: 'pipe'
    })
    console.log(chalk.green(`Successfully published ${pkgName}@${version}`))
  } catch (e) {
    if (e.stderr.match(/previously published/)) {
      console.log(chalk.red(`Skipping already published: ${pkgName}`))
    } else {
      throw e
    }
  }
}

main().catch((err) => {
  console.error(err)
})
