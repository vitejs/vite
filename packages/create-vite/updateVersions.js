const fs = require('fs')
const path = require('path')

;(async () => {
  const templates = fs
    .readdirSync(__dirname)
    .filter((d) => d.startsWith('template-'))
  for (const t of templates) {
    const pkgPath = path.join(__dirname, t, `package.json`)
    const pkg = require(pkgPath)
    pkg.devDependencies.vite = `^` + require('../vite/package.json').version
    if (t.startsWith('template-vue')) {
      pkg.devDependencies['@vitejs/plugin-vue'] =
        `^` + require('../plugin-vue/package.json').version
    }
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  }
})()
