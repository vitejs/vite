#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const writeFile = promisify(fs.writeFile)
const copyFile = promisify(fs.copyFile)
const mkdir = promisify(fs.mkdir)

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
      await writeFile(writePath, content)
    } else {
      await copyFile(path.join(__dirname, `template/_${file}`), writePath)
    }
  }

  try {
    await mkdir(root)
  } catch (e) {
    if (e.code === 'EEXIST') {
      console.error(`Error: target directory already exists.`)
    } else {
      throw e
    }
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
