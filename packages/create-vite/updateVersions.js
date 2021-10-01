const fs = require('fs')
const path = require('path')
const latestVersion = require('../vite/package.json').version
const isLatestPreRelease = /beta|alpha|rc/.test(latestVersion)

;(async () => {
  const templatesDir = path.join(__dirname, 'templates')
  const templates = fs
    .readdirSync(templatesDir)
    .filter((d) => d.startsWith('template-'))
  for (const t of templates) {
    const pkgPath = path.join(templatesDir, t, `package.json`)
    const pkg = require(pkgPath)
    if (!isLatestPreRelease) {
      pkg.devDependencies.vite = `^` + latestVersion
    }
    if (t.startsWith('template-vue')) {
      pkg.devDependencies['@vitejs/plugin-vue'] =
        `^` + require('../plugin-vue/package.json').version
    }
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  }
})()
