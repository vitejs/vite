#!/usr/bin/env node
const path = require('path')
const { promises: fs } = require('fs')

async function init() {
  const targetDir = process.argv[2]

  if (!targetDir) {
    console.error(
      `Error: Please specify target directory. Example: create-vite-app my-project`
    )
    return
  }
  const root = path.join(process.cwd(), targetDir || '')
  console.log(`Scaffolding project in ${root}...`)

  const write = async (file, content) => {
    const writePath = path.join(root, file)
    if (content) {
      await fs.writeFile(writePath, content)
    } else {
      await fs.copyFile(path.join(__dirname, `template/_${file}`), writePath)
    }
  }

  try {
    await fs.mkdir(root)
  } catch (e) {
    console.error(`Error: target directory alreay exists.`)
    return
  }

  await write('index.html')
  await write('App.vue')

  const pkg = require('./template/_package.json')
  pkg.name = path.basename(root)
  await write('package.json', JSON.stringify(pkg, null, 2))

  console.log(`Done. Now run: `)
  console.log()
  console.log(`  cd ${path.relative(process.cwd(), root)}`)
  console.log(`  npm install (or \`yarn\`)`)
  console.log(`  npx vite (or \`yarn vite\`)`)
  console.log()
}

init().catch((e) => {
  console.error(e)
})
