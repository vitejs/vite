import fs from 'node:fs/promises'
import path from 'node:path'

export const releasePackages = ['vite', 'create-vite', 'plugin-legacy'] as const

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
