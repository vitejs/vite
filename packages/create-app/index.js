#!/usr/bin/env node

// @ts-check
const fs = require('fs')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2))
const { prompt } = require('enquirer')

const cwd = process.cwd()

const renameFiles = {
  _gitignore: '.gitignore'
}

async function init() {
  let targetDir = argv._[0]
  if (!targetDir) {
    /**
     * @type {{ name: string }}
     */
    const { name } = await prompt({
      type: 'input',
      name: 'name',
      message: `Project name:`,
      initial: 'vite-project'
    })
    targetDir = name
  }

  const root = path.join(cwd, targetDir)
  console.log(`Scaffolding project in ${root}...`)

  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true })
  } else {
    const existing = fs.readdirSync(root)
    if (existing.length) {
      /**
       * @type {{ yes: boolean }}
       */
      const { yes } = await prompt({
        type: 'confirm',
        name: 'yes',
        initial: 'Y',
        message:
          `Target directory ${targetDir} is not empty.\n` +
          `Remove existing files and continue?`
      })
      if (yes) {
        emptyDir(root)
      } else {
        return
      }
    }
  }

  // determine template
  let template = argv.t || argv.template
  if (!template) {
    /**
     * @type {{ t: string }}
     */
    const { t } = await prompt({
      type: 'select',
      name: 't',
      message: `Select a template:`,
      choices: ['vanilla', 'vue', 'vue-ts', 'react', 'react-ts']
    })
    template = t
  }

  const templateDir = path.join(__dirname, `template-${template}`)

  const write = (file, content) => {
    const targetPath = renameFiles[file]
      ? path.join(root, renameFiles[file])
      : path.join(root, file)
    if (content) {
      fs.writeFileSync(targetPath, content)
    } else {
      copy(path.join(templateDir, file), targetPath)
    }
  }

  const files = fs.readdirSync(templateDir)
  for (const file of files.filter((f) => f !== 'package.json')) {
    write(file)
  }

  const pkg = require(path.join(templateDir, `package.json`))
  pkg.name = path.basename(root)
  write('package.json', JSON.stringify(pkg, null, 2))

  console.log(`\nDone. Now run:\n`)
  if (root !== cwd) {
    console.log(`  cd ${path.relative(cwd, root)}`)
  }
  console.log(`  npm install (or \`yarn\`)`)
  console.log(`  npm run dev (or \`yarn dev\`)`)
  console.log()
}

function copy(src, dest) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    copyDir(src, dest)
  } else {
    fs.copyFileSync(src, dest)
  }
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    const destFile = path.resolve(destDir, file)
    copy(srcFile, destFile)
  }
}

function emptyDir(dir) {
  if (!fs.existsSync(dir)) {
    return
  }
  for (const file of fs.readdirSync(dir)) {
    const abs = path.resolve(dir, file)
    // baseline is Node 12 so can't use rmSync :(
    if (fs.lstatSync(abs).isDirectory()) {
      emptyDir(abs)
      fs.rmdirSync(abs)
    } else {
      fs.unlinkSync(abs)
    }
  }
}

init().catch((e) => {
  console.error(e)
})
