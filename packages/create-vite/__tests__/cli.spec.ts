/* eslint-disable node/no-extraneous-import */
import type { ExecaSyncReturnValue, SyncOptions } from 'execa'
import execa, { commandSync, Options } from 'execa'
import { mkdirpSync, readdirSync, remove, writeFileSync } from 'fs-extra'
import { join } from 'path'

const CLI_PATH = join(__dirname, '..')

const projectName = 'test-app'
const genPath = join(__dirname, projectName)

const run = (
  args: string[],
  options: SyncOptions<string> = {}
): ExecaSyncReturnValue<string> => {
  return commandSync(`node ${CLI_PATH} ${args.join(' ')}`, options)
}

const runAsync = (args: string[], options: Options = {}) => {
  return execa('node', [CLI_PATH, ...args], options)
}

// Helper to create a non-empty directory
const createNonEmptyDir = () => {
  // Create the temporary directory
  mkdirpSync(genPath)

  // Create a package.json file
  const pkgJson = join(genPath, 'package.json')
  writeFileSync(pkgJson, '{ "foo": "bar" }')
}

// Vue 3 starter template
const templateFiles = readdirSync(join(CLI_PATH, 'template-vue'))
  // _gitignore is renamed to .gitignore
  .map((filePath) => (filePath === '_gitignore' ? '.gitignore' : filePath))
  .sort()

const scaffoldsProjectExpect = (stdout: string) => {
  const generatedFiles = readdirSync(genPath).sort()
  expect(stdout).toContain(`Scaffolding project in ${genPath}`)
  expect(generatedFiles).toEqual(templateFiles)
}

beforeAll(() => remove(genPath))
afterEach(() => remove(genPath))

test('prompts for the project name if none supplied', () => {
  const { stdout } = run([])
  expect(stdout).toContain('Project name:')
})

test('prompts for the framework if none supplied', () => {
  const { stdout } = run([projectName])
  expect(stdout).toContain('Select a framework:')
})

test('prompts for the framework on not supplying a value for --template', () => {
  const { stdout } = run([projectName, '--template'])
  expect(stdout).toContain('Select a framework:')
})

test('prompts for the framework on supplying an invalid template', () => {
  const { stdout } = run([projectName, '--template', 'unknown'])
  expect(stdout).toContain(
    `"unknown" isn't a valid template. Please choose from below:`
  )
})

test('asks to overwrite non-empty target directory', () => {
  createNonEmptyDir()
  const { stdout } = run([projectName], { cwd: __dirname })
  expect(stdout).toContain(`Target directory "${projectName}" is not empty.`)
})

test('asks to overwrite non-empty current directory', () => {
  createNonEmptyDir()
  const { stdout } = run(['.'], { cwd: genPath, input: 'test-app\n' })
  expect(stdout).toContain(`Current directory is not empty.`)
})

test('answer n to prompt for overwrite non-empty current directory', () => {
  createNonEmptyDir()
  const { stdout } = run([projectName], { cwd: __dirname, input: 'n' })
  expect(stdout).toContain('Operation cancelled')
})

test('prompt for install and start it now', () => {
  const { stdout } = run([projectName, '-t', 'react'], {
    cwd: __dirname
  })
  expect(stdout).toContain(`Install and start it now?`)
})

test('answer n to prompt for install and start it now', () => {
  const { stdout } = run([projectName, '-t', 'vue'], {
    cwd: __dirname,
    input: 'n'
  })
  scaffoldsProjectExpect(stdout)
})

test('prompt for choose the agent', () => {
  const { stdout } = run([projectName, '--template', 'preact'], {
    cwd: __dirname,
    input: 'y'
  })
  expect(stdout).toContain(`Choose the agent:`)
})

test('successfully scaffolds a project with vue template and -i', () => {
  const { stdout } = run([projectName, '--template', 'vue', '-i'], {
    cwd: __dirname
  })
  scaffoldsProjectExpect(stdout)
})

test('successfully scaffolds a project with vue template and --immediate to non-empty directory', () => {
  createNonEmptyDir()
  const { stdout } = run([projectName, '--template', 'vue', '--immediate'], {
    cwd: __dirname,
    input: 'y'
  })
  scaffoldsProjectExpect(stdout)
})

const speicalJestTime = 60 * 1000
const expectRunTime = 30 * 1000
test(
  'successfully start a project by npm agent',
  async () => {
    const subprocess = runAsync([projectName, '-t', 'vanilla'], {
      cwd: __dirname
    })
    const [waiting, resolveWaiting] = (() => {
      let resolve$
      const waiting = new Promise<void>((resolve) => {
        resolve$ = resolve
      })
      const race = setTimeout(() => {
        resolve$()
      }, expectRunTime)
      return [
        waiting,
        () => {
          clearTimeout(race)
          resolve$()
        }
      ]
    })()
    let text = ''
    const { stdin, stdout } = subprocess
    stdout.on('data', (data) => {
      text = data.toString()
      if (text.includes('Install and start it now?')) {
        stdin.write('y\n')
      }
      if (text.includes('Choose the agent:')) {
        stdin.write('\n')
      }
      if (text.includes('ready in')) {
        resolveWaiting()
      }
    })
    await waiting
    subprocess.kill('SIGHUP')
    expect(text).toContain('ready in')
  },
  speicalJestTime
)
