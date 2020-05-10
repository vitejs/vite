#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const writeFile = promisify(fs.writeFile)
const copyFile = promisify(fs.copyFile)
const mkdir = promisify(fs.mkdir)
const readdir = promisify(fs.readdir)
const argv = require('minimist')(process.argv.slice(2))

async function init() {
  const targetDir = argv._[0]
  if (!targetDir) {
    console.error(
      `Error: Please specify target directory. Example: create-vite-app my-project`
    )
    return
  }
  const root = path.resolve(process.cwd(), targetDir || '')
  console.log(`Scaffolding project in ${root}...`)

  const filesInRoot = await readdir(root).then(null, async (error) => {
    if (error.code === 'ENOENT') {
      await mkdir(root)
    }
    return []
  })

  if (filesInRoot.length > 0) {
    console.error(`Error: target directory is not empty`)
    return
  }

  const templateDir = path.join(__dirname, `template-${argv.template || 'vue'}`)
  const write = async (file, content) => {
    const targetPath = path.join(root, file)
    if (content) {
      await writeFile(targetPath, content)
    } else {
      await copyFile(path.join(templateDir, file), targetPath)
    }
  }

  const files = await readdir(templateDir)
  for (const file of files.filter((f) => f !== 'package.json')) {
    await write(file)
  }

  const pkg = require(path.join(templateDir, `package.json`))
  pkg.name = targetDir
  await write('package.json', JSON.stringify(pkg, null, 2))

  console.log(`Done. Now run: `)
  console.log()
  console.log(`  cd ${path.relative(process.cwd(), root)}`)
  console.log(`  npm install (or \`yarn\`)`)
  console.log(`  npm run dev (or \`yarn dev\`)`)
  console.log()
}

init().catch((e) => {
  console.error(e)
})
