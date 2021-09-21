const fs = require('fs')
const path = require('path')
const latestVersion = require('../vite/package.json').version
const isLatestPreRelease = /beta|alpha|rc/.test(latestVersion)

;(async () => {
  const templates = fs
    .readdirSync(__dirname)
    .filter((d) => d.startsWith('template-'))
  for (const t of templates) {
    const pkgPath = path.join(__dirname, t, `package.json`)
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
