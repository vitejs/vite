const fs = require('fs-extra')
const path = require('path')

;(async () => {
  const templates = (await fs.readdir(__dirname)).filter((d) =>
    d.startsWith('template-')
  )
  for (const t of templates) {
    const pkgPath = path.join(__dirname, t, `package.json`)
    const pkg = require(pkgPath)
    pkg.devDependencies.vite = `^` + require('../package.json').version
    if (t === 'vue') {
      pkg.dependencies.vue = `^` + require('vue/package.json').version
      pkg.devDependencies['@vue/compiler-sfc'] = pkg.dependencies.vue
    }
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2))
  }
})()
