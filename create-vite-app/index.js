#!/usr/bin/env node
const path = require('path')
const { promises: fs } = require('fs')

const { name, version } = require('./package')

async function init() {
  const [, , ...args] = process.argv

  if (!args.length) {
    console.error(
      `Error: Please specify target directory. Example: create-vite-app my-project`
    )
    return
  }

  const helpInfo = `Usage: ${name} <target-dir> [options]\n\n Available options\n\n --help, -h\n -- version, -v`

  if (args[0].startsWith('-')) {
    if (['-h', '--help'].includes(args[0])) {
      console.log(helpInfo)
    } else if (['-v', '--version'].includes(args[0])) {
      console.log(version)
    } else {
      console.error(`Invalid option, use ${name} --help to know more`)
    }
    return
  }

  const targetDir = args[0]

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
