import fs from 'node:fs'
import path from 'node:path'
import type { SyncOptions } from 'execa'
import { execaCommandSync } from 'execa'
import { afterEach, beforeAll, expect, test } from 'vitest'

const CLI_PATH = path.join(import.meta.dirname, '..')

const projectName = 'test-app'
const genPath = path.join(import.meta.dirname, projectName)
const genPathWithSubfolder = path.join(
  import.meta.dirname,
  'subfolder',
  projectName,
)

const run = (args: string[], options?: SyncOptions) => {
  return execaCommandSync(`node ${CLI_PATH} ${args.join(' ')}`, {
    env: { ...process.env, _VITE_TEST_CLI: 'true' },
    ...options,
  })
}

// Helper to create a non-empty directory
const createNonEmptyDir = (overrideFolder?: string) => {
  // Create the temporary directory
  const newNonEmptyFolder = overrideFolder || genPath
  fs.mkdirSync(newNonEmptyFolder, { recursive: true })

  // Create a package.json file
  const pkgJson = path.join(newNonEmptyFolder, 'package.json')
  fs.writeFileSync(pkgJson, '{ "foo": "bar" }')
}

// Vue 3 starter template
const templateFiles = fs
  .readdirSync(path.join(CLI_PATH, 'template-vue'))
  // _gitignore is renamed to .gitignore
  .map((filePath) => (filePath === '_gitignore' ? '.gitignore' : filePath))
  .sort()

// React starter template
const templateFilesReact = fs
  .readdirSync(path.join(CLI_PATH, 'template-react'))
  // _gitignore is renamed to .gitignore
  .map((filePath) => (filePath === '_gitignore' ? '.gitignore' : filePath))
  .sort()

const clearAnyPreviousFolders = () => {
  if (fs.existsSync(genPath)) {
    fs.rmSync(genPath, { recursive: true, force: true })
  }
  if (fs.existsSync(genPathWithSubfolder)) {
    fs.rmSync(genPathWithSubfolder, { recursive: true, force: true })
  }
}

beforeAll(() => clearAnyPreviousFolders())
afterEach(() => clearAnyPreviousFolders())

test('prompts for the project name if none supplied', () => {
  const { stdout } = run(['--interactive'])
  expect(stdout).toContain('Project name:')
})

test('prompts for the framework if none supplied when target dir is current directory', () => {
  fs.mkdirSync(genPath, { recursive: true })
  const { stdout } = run(['.', '--interactive'], { cwd: genPath })
  expect(stdout).toContain('Select a framework:')
})

test('prompts for the framework if none supplied', () => {
  const { stdout } = run([projectName, '--interactive'])
  expect(stdout).toContain('Select a framework:')
})

test('prompts for the framework on not supplying a value for --template', () => {
  const { stdout } = run([projectName, '--interactive', '--template'])
  expect(stdout).toContain('Select a framework:')
})

test('prompts for the framework on supplying an invalid template', () => {
  const { stdout } = run([
    projectName,
    '--interactive',
    '--template',
    'unknown',
  ])
  expect(stdout).toContain(
    `"unknown" isn't a valid template. Please choose from below:`,
  )
})

test('asks to overwrite non-empty target directory', () => {
  createNonEmptyDir()
  const { stdout } = run([projectName, '--interactive'], {
    cwd: import.meta.dirname,
  })
  expect(stdout).toContain(`Target directory "${projectName}" is not empty.`)
})

test('asks to overwrite non-empty target directory with subfolder', () => {
  createNonEmptyDir(genPathWithSubfolder)
  const { stdout } = run([`subfolder/${projectName}`, '--interactive'], {
    cwd: import.meta.dirname,
  })
  expect(stdout).toContain(
    `Target directory "subfolder/${projectName}" is not empty.`,
  )
})

test('asks to overwrite non-empty current directory', () => {
  createNonEmptyDir()
  const { stdout } = run(['.', '--interactive'], { cwd: genPath })
  expect(stdout).toContain(`Current directory is not empty.`)
})

test('successfully scaffolds a project based on vue starter template', () => {
  const { stdout } = run(
    [
      projectName,
      '--interactive',
      '--no-immediate',
      '--template',
      'vue',
      '--no-rolldown',
    ],
    {
      cwd: import.meta.dirname,
    },
  )
  const generatedFiles = fs.readdirSync(genPath).sort()

  // Assertions
  expect(stdout).toContain(`Scaffolding project in ${genPath}`)
  expect(templateFiles).toEqual(generatedFiles)
})

test('successfully scaffolds a project with subfolder based on react starter template', () => {
  const { stdout } = run(
    [
      `subfolder/${projectName}`,
      '--interactive',
      '--no-immediate',
      '--template',
      'react',
      '--no-rolldown',
    ],
    {
      cwd: import.meta.dirname,
    },
  )
  const generatedFiles = fs.readdirSync(genPathWithSubfolder).sort()

  // Assertions
  expect(stdout).toContain(`Scaffolding project in ${genPathWithSubfolder}`)
  expect(templateFilesReact).toEqual(generatedFiles)
})

test('successfully scaffolds a project based on react-compiler-ts starter template', () => {
  const { stdout } = run([projectName, '--template', 'react-compiler-ts'], {
    cwd: import.meta.dirname,
  })
  const configFile = fs.readFileSync(
    path.join(genPath, 'vite.config.ts'),
    'utf-8',
  )
  const packageJsonFile = fs.readFileSync(
    path.join(genPath, 'package.json'),
    'utf-8',
  )
  const readmeFile = fs.readFileSync(path.join(genPath, 'README.md'), 'utf-8')

  // Assertions
  expect(stdout).toContain(`Scaffolding project in ${genPath}`)
  expect(configFile).toContain('babel-plugin-react-compiler')
  expect(packageJsonFile).toContain('babel-plugin-react-compiler')
  expect(readmeFile).toContain('The React Compiler is enabled on this template')
})

test('works with the -t alias', () => {
  const { stdout } = run(
    [
      projectName,
      '--interactive',
      '--no-immediate',
      '-t',
      'vue',
      '--no-rolldown',
    ],
    {
      cwd: import.meta.dirname,
    },
  )
  const generatedFiles = fs.readdirSync(genPath).sort()

  // Assertions
  expect(stdout).toContain(`Scaffolding project in ${genPath}`)
  expect(templateFiles).toEqual(generatedFiles)
})

test('accepts command line override for --overwrite', () => {
  createNonEmptyDir()
  const { stdout } = run(['.', '--interactive', '--overwrite', 'ignore'], {
    cwd: genPath,
  })
  expect(stdout).not.toContain(`Current directory is not empty.`)
})

test('skip prompts when --no-interactive is passed', () => {
  createNonEmptyDir()
  const { stdout } = run([projectName, '--no-interactive'], { cwd: genPath })
  expect(stdout).not.toContain('Project name:')
  expect(stdout).toContain('Done. Now run:')
})

test('return help usage how to use create-vite', () => {
  const { stdout } = run(['--help'], { cwd: import.meta.dirname })
  const message = 'Usage: create-vite [OPTION]... [DIRECTORY]'
  expect(stdout).toContain(message)
})

test('return help usage how to use create-vite with -h alias', () => {
  const { stdout } = run(['--h'], { cwd: import.meta.dirname })
  const message = 'Usage: create-vite [OPTION]... [DIRECTORY]'
  expect(stdout).toContain(message)
})

test('sets index.html title to project name', () => {
  const { stdout } = run([projectName, '--template', 'react'], {
    cwd: import.meta.dirname,
  })

  const indexHtmlPath = path.join(genPath, 'index.html')
  const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf-8')

  expect(stdout).toContain(`Scaffolding project in ${genPath}`)
  expect(indexHtmlContent).toContain(`<title>${projectName}</title>`)
})

test('accepts immediate flag', () => {
  const { stdout } = run([projectName, '--template', 'vue', '--immediate'], {
    cwd: import.meta.dirname,
  })
  expect(stdout).not.toContain('Install and start now?')
  expect(stdout).toContain(`Scaffolding project in ${genPath}`)
  expect(stdout).toContain('Installing dependencies')
})

test('accepts immediate flag and skips install prompt', () => {
  const { stdout } = run([projectName, '--template', 'vue', '--no-immediate'], {
    cwd: import.meta.dirname,
  })
  expect(stdout).not.toContain('Install and start now?')
  expect(stdout).not.toContain('Installing dependencies')
  expect(stdout).toContain(`Scaffolding project in ${genPath}`)
})
