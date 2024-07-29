import fs from 'node:fs/promises'
import path from 'node:path'
import colors from 'picocolors'
import type { Options as ExecaOptions, ResultPromise } from 'execa'
import { execa } from 'execa'

export function run<EO extends ExecaOptions>(
  bin: string,
  args: string[],
  opts?: EO,
): ResultPromise<EO & (keyof EO extends 'stdio' ? {} : { stdio: 'inherit' })> {
  return execa(bin, args, { stdio: 'inherit', ...opts }) as any
}

export async function getLatestTag(pkgName: string): Promise<string> {
  const pkgJson = JSON.parse(
    await fs.readFile(`packages/${pkgName}/package.json`, 'utf-8'),
  )
  const version = pkgJson.version
  return pkgName === 'vite' ? `v${version}` : `${pkgName}@${version}`
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
  const vitePkgJson = JSON.parse(
    await fs.readFile('packages/vite/package.json', 'utf-8'),
  )
  const viteVersion = vitePkgJson.version
  if (/beta|alpha|rc/.test(viteVersion)) return

  const dir = 'packages/create-vite'
  const templates = (await fs.readdir(dir)).filter((dir) =>
    dir.startsWith('template-'),
  )
  for (const template of templates) {
    const pkgPath = path.join(dir, template, `package.json`)
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'))
    pkg.devDependencies.vite = `^` + viteVersion
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  }
}
