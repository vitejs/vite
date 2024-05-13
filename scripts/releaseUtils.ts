import { readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import semver from 'semver'
import colors from 'picocolors'
import type { Options as ExecaOptions, ResultPromise } from 'execa'
import { execa } from 'execa'
import fs from 'fs-extra'

export function run<EO extends ExecaOptions>(
  bin: string,
  args: string[],
  opts?: EO,
): ResultPromise<EO & (keyof EO extends 'stdio' ? {} : { stdio: 'inherit' })> {
  return execa(bin, args, { stdio: 'inherit', ...opts }) as any
}

export async function getLatestTag(pkgName: string): Promise<string> {
  const tags = (await run('git', ['tag'], { stdio: 'pipe' })).stdout
    .split(/\n/)
    .filter(Boolean)
  const prefix = pkgName === 'vite' ? 'v' : `${pkgName}@`
  return tags
    .filter((tag) => tag.startsWith(prefix))
    .sort((a, b) =>
      semver.rcompare(a.slice(prefix.length), b.slice(prefix.length)),
    )[0]
}

export async function logRecentCommits(pkgName: string): Promise<void> {
  const tag = await getLatestTag(pkgName)
  if (!tag) return
  const sha = await run('git', ['rev-list', '-n', '1', tag], {
    stdio: 'pipe',
  }).then((res) => res.stdout.trim())
  console.log(
    colors.bold(
      `\n${colors.blue(`i`)} Commits of ${colors.green(
        pkgName,
      )} since ${colors.green(tag)} ${colors.gray(`(${sha.slice(0, 5)})`)}`,
    ),
  )
  await run(
    'git',
    [
      '--no-pager',
      'log',
      `${sha}..HEAD`,
      '--oneline',
      '--',
      `packages/${pkgName}`,
    ],
    { stdio: 'inherit' },
  )
  console.log()
}

export async function updateTemplateVersions(): Promise<void> {
  const viteVersion = fs.readJSONSync('packages/vite/package.json').version
  if (/beta|alpha|rc/.test(viteVersion)) return

  const dir = 'packages/create-vite'
  const templates = readdirSync(dir).filter((dir) =>
    dir.startsWith('template-'),
  )
  for (const template of templates) {
    const pkgPath = path.join(dir, template, `package.json`)
    const pkg = fs.readJSONSync(pkgPath)
    pkg.devDependencies.vite = `^` + viteVersion
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  }
}
