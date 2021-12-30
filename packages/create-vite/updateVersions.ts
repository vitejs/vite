import { readdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const latestVersion = require('../vite/package.json').version
const isLatestPreRelease = /beta|alpha|rc/.test(latestVersion)

;(async () => {
  const templates = readdirSync(__dirname).filter((dir) =>
    dir.startsWith('template-')
  )
  for (const template of templates) {
    const pkgPath = join(__dirname, template, `package.json`)
    const pkg = require(pkgPath)
    if (!isLatestPreRelease) {
      pkg.devDependencies.vite = `^` + latestVersion
    }
    if (template.startsWith('template-vue')) {
      pkg.devDependencies['@vitejs/plugin-vue'] =
        `^` + require('../plugin-vue/package.json').version
    }
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  }
})()
