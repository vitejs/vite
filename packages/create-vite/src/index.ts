import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { SpawnOptions } from 'node:child_process'
import spawn from 'cross-spawn'
import mri from 'mri'
import * as prompts from '@clack/prompts'
import colors from 'picocolors'
import { determineAgent } from '@vercel/detect-agent'

const {
  blue,
  blueBright,
  cyan,
  green,
  greenBright,
  magenta,
  red,
  redBright,
  reset,
  yellow,
} = colors

const argv = mri<{
  template?: string
  help?: boolean
  overwrite?: boolean
  immediate?: boolean
  interactive?: boolean
}>(process.argv.slice(2), {
  boolean: ['help', 'overwrite', 'immediate', 'rolldown', 'interactive'],
  alias: { h: 'help', t: 'template', i: 'immediate' },
  string: ['template'],
})
const cwd = process.cwd()

// prettier-ignore
const helpMessage = `\
Usage: create-vite [OPTION]... [DIRECTORY]

Create a new Vite project in JavaScript or TypeScript.
When running in TTY, the CLI will start in interactive mode.

Options:
  -t, --template NAME                   use a specific template
  -i, --immediate                       install dependencies and start dev
  --interactive / --no-interactive      force interactive / non-interactive mode

Available templates:
${yellow    ('vanilla-ts          vanilla'       )}
${green     ('vue-ts              vue'           )}
${cyan      ('react-ts            react'         )}
${cyan      ('react-compiler-ts   react-compiler')}
${cyan      ('react-swc-ts        react-swc'     )}
${magenta   ('preact-ts           preact'        )}
${redBright ('lit-ts              lit'           )}
${red       ('svelte-ts           svelte'        )}
${blue      ('solid-ts            solid'         )}
${blueBright('qwik-ts             qwik'          )}`

type ColorFunc = (str: string | number) => string
type Framework = {
  name: string
  display: string
  color: ColorFunc
  variants: FrameworkVariant[]
}
type FrameworkVariant = {
  name: string
  display: string
  color: ColorFunc
  customCommand?: string
}

const FRAMEWORKS: Framework[] = [
  {
    name: 'vanilla',
    display: 'Vanilla',
    color: yellow,
    variants: [
      {
        name: 'vanilla-ts',
        display: 'TypeScript',
        color: blue,
      },
      {
        name: 'vanilla',
        display: 'JavaScript',
        color: yellow,
      },
    ],
  },
  {
    name: 'vue',
    display: 'Vue',
    color: green,
    variants: [
      {
        name: 'vue-ts',
        display: 'TypeScript',
        color: blue,
      },
      {
        name: 'vue',
        display: 'JavaScript',
        color: yellow,
      },
      {
        name: 'custom-create-vue',
        display: 'Official Vue Starter ↗',
        color: green,
        customCommand: 'npm create vue@latest TARGET_DIR',
      },
      {
        name: 'custom-nuxt',
        display: 'Nuxt ↗',
        color: greenBright,
        customCommand: 'npm exec nuxi init TARGET_DIR',
      },
      {
        name: 'custom-vike-vue',
        display: 'Vike ↗',
        color: greenBright,
        customCommand: 'npm create -- vike@latest --vue TARGET_DIR',
      },
    ],
  },
  {
    name: 'react',
    display: 'React',
    color: cyan,
    variants: [
      {
        name: 'react-ts',
        display: 'TypeScript',
        color: blue,
      },
      {
        name: 'react-compiler-ts',
        display: 'TypeScript + React Compiler',
        color: blue,
      },
      {
        name: 'react-swc-ts',
        display: 'TypeScript + SWC',
        color: blue,
      },
      {
        name: 'react',
        display: 'JavaScript',
        color: yellow,
      },
      {
        name: 'react-compiler',
        display: 'JavaScript + React Compiler',
        color: yellow,
      },
      {
        name: 'react-swc',
        display: 'JavaScript + SWC',
        color: yellow,
      },
      {
        name: 'custom-react-router',
        display: 'React Router v7 ↗',
        color: cyan,
        customCommand: 'npm create react-router@latest TARGET_DIR',
      },
      {
        name: 'custom-tanstack-router-react',
        display: 'TanStack Router ↗',
        color: cyan,
        customCommand:
          'npm create -- tsrouter-app@latest TARGET_DIR --framework React --interactive',
      },
      {
        name: 'redwoodsdk-standard',
        display: 'RedwoodSDK ↗',
        color: red,
        customCommand: 'npm create rwsdk@latest TARGET_DIR',
      },
      {
        name: 'rsc',
        display: 'RSC ↗',
        color: magenta,
        customCommand:
          'npm exec degit vitejs/vite-plugin-react/packages/plugin-rsc/examples/starter TARGET_DIR',
      },
      {
        name: 'custom-vike-react',
        display: 'Vike ↗',
        color: cyan,
        customCommand: 'npm create -- vike@latest --react TARGET_DIR',
      },
    ],
  },
  {
    name: 'preact',
    display: 'Preact',
    color: magenta,
    variants: [
      {
        name: 'preact-ts',
        display: 'TypeScript',
        color: blue,
      },
      {
        name: 'preact',
        display: 'JavaScript',
        color: yellow,
      },
      {
        name: 'custom-create-preact',
        display: 'Official Preact Starter ↗',
        color: magenta,
        customCommand: 'npm create preact@latest TARGET_DIR',
      },
    ],
  },
  {
    name: 'lit',
    display: 'Lit',
    color: redBright,
    variants: [
      {
        name: 'lit-ts',
        display: 'TypeScript',
        color: blue,
      },
      {
        name: 'lit',
        display: 'JavaScript',
        color: yellow,
      },
    ],
  },
  {
    name: 'svelte',
    display: 'Svelte',
    color: red,
    variants: [
      {
        name: 'svelte-ts',
        display: 'TypeScript',
        color: blue,
      },
      {
        name: 'svelte',
        display: 'JavaScript',
        color: yellow,
      },
      {
        name: 'custom-svelte-kit',
        display: 'SvelteKit ↗',
        color: red,
        customCommand: 'npm exec sv create TARGET_DIR',
      },
    ],
  },
  {
    name: 'solid',
    display: 'Solid',
    color: blue,
    variants: [
      {
        name: 'solid-ts',
        display: 'TypeScript',
        color: blue,
      },
      {
        name: 'solid',
        display: 'JavaScript',
        color: yellow,
      },
      {
        name: 'custom-tanstack-router-solid',
        display: 'TanStack Router ↗',
        color: cyan,
        customCommand:
          'npm create -- tsrouter-app@latest TARGET_DIR --framework Solid --interactive',
      },
      {
        name: 'custom-vike-solid',
        display: 'Vike ↗',
        color: cyan,
        customCommand: 'npm create -- vike@latest --solid TARGET_DIR',
      },
    ],
  },
  {
    name: 'ember',
    display: 'Ember',
    color: redBright,
    variants: [
      {
        name: 'ember-app-ts',
        display: 'TypeScript ↗',
        color: blueBright,
        customCommand:
          'npm exec -- ember-cli@latest new TARGET_DIR --typescript',
      },
      {
        name: 'ember-app',
        display: 'JavaScript ↗',
        color: redBright,
        customCommand: 'npm exec -- ember-cli@latest new TARGET_DIR',
      },
    ],
  },
  {
    name: 'qwik',
    display: 'Qwik',
    color: blueBright,
    variants: [
      {
        name: 'qwik-ts',
        display: 'TypeScript',
        color: blueBright,
      },
      {
        name: 'qwik',
        display: 'JavaScript',
        color: yellow,
      },
      {
        name: 'custom-qwik-city',
        display: 'QwikCity ↗',
        color: blueBright,
        customCommand: 'npm create qwik@latest basic TARGET_DIR',
      },
    ],
  },
  {
    name: 'angular',
    display: 'Angular',
    color: red,
    variants: [
      {
        name: 'custom-angular',
        display: 'Angular ↗',
        color: red,
        customCommand: 'npm exec @angular/cli@latest new TARGET_DIR',
      },
      {
        name: 'custom-analog',
        display: 'Analog ↗',
        color: yellow,
        customCommand: 'npm create analog@latest TARGET_DIR',
      },
    ],
  },
  {
    name: 'marko',
    display: 'Marko',
    color: magenta,
    variants: [
      {
        name: 'marko-run',
        display: 'Marko Run ↗',
        color: magenta,
        customCommand: 'npm create -- marko@latest --name TARGET_DIR',
      },
    ],
  },
  {
    name: 'others',
    display: 'Others',
    color: reset,
    variants: [
      {
        name: 'create-vite-extra',
        display: 'Extra Vite Starters ↗',
        color: reset,
        customCommand: 'npm create vite-extra@latest TARGET_DIR',
      },
      {
        name: 'create-electron-vite',
        display: 'Electron ↗',
        color: reset,
        customCommand: 'npm create electron-vite@latest TARGET_DIR',
      },
    ],
  },
]

const TEMPLATES = FRAMEWORKS.map((f) => f.variants.map((v) => v.name)).reduce(
  (a, b) => a.concat(b),
  [],
)

const renameFiles: Record<string, string | undefined> = {
  _gitignore: '.gitignore',
}

const defaultTargetDir = 'vite-project'

function run([command, ...args]: string[], options?: SpawnOptions) {
  const { status, error } = spawn.sync(command, args, options)
  if (status != null && status > 0) {
    process.exit(status)
  }

  if (error) {
    console.error(`\n${command} ${args.join(' ')} error!`)
    console.error(error)
    process.exit(1)
  }
}

function install(root: string, agent: string) {
  if (process.env._VITE_TEST_CLI) {
    prompts.log.step(
      `Installing dependencies with ${agent}... (skipped in test)`,
    )
    return
  }
  prompts.log.step(`Installing dependencies with ${agent}...`)
  run(getInstallCommand(agent), {
    stdio: 'inherit',
    cwd: root,
  })
}

function start(root: string, agent: string) {
  if (process.env._VITE_TEST_CLI) {
    prompts.log.step('Starting dev server... (skipped in test)')
    return
  }
  prompts.log.step('Starting dev server...')
  run(getRunCommand(agent, 'dev'), {
    stdio: 'inherit',
    cwd: root,
  })
}

async function init() {
  const argTargetDir = argv._[0]
    ? formatTargetDir(String(argv._[0]))
    : undefined
  const argTemplate = argv.template
  const argOverwrite = argv.overwrite
  const argImmediate = argv.immediate
  const argInteractive = argv.interactive

  const help = argv.help
  if (help) {
    console.log(helpMessage)
    return
  }

  const interactive = argInteractive ?? process.stdin.isTTY

  // Detect AI agent environment for better agent experience (AX)
  const { isAgent } = await determineAgent()
  if (isAgent && interactive) {
    console.log(
      '\nTo create in one go, run: create-vite <DIRECTORY> --no-interactive --template <TEMPLATE>\n',
    )
  }

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent)
  const cancel = () => prompts.cancel('Operation cancelled')

  // 1. Get project name and target dir
  let targetDir = argTargetDir
  if (!targetDir) {
    if (interactive) {
      const projectName = await prompts.text({
        message: 'Project name:',
        defaultValue: defaultTargetDir,
        placeholder: defaultTargetDir,
        validate: (value) => {
          return value.length === 0 || formatTargetDir(value).length > 0
            ? undefined
            : 'Invalid project name'
        },
      })
      if (prompts.isCancel(projectName)) return cancel()
      targetDir = formatTargetDir(projectName)
    } else {
      targetDir = defaultTargetDir
    }
  }

  // 2. Handle directory if exist and not empty
  if (fs.existsSync(targetDir) && !isEmpty(targetDir)) {
    let overwrite: 'yes' | 'no' | 'ignore' | undefined = argOverwrite
      ? 'yes'
      : undefined
    if (!overwrite) {
      if (interactive) {
        const res = await prompts.select({
          message:
            (targetDir === '.'
              ? 'Current directory'
              : `Target directory "${targetDir}"`) +
            ` is not empty. Please choose how to proceed:`,
          options: [
            {
              label: 'Cancel operation',
              value: 'no',
            },
            {
              label: 'Remove existing files and continue',
              value: 'yes',
            },
            {
              label: 'Ignore files and continue',
              value: 'ignore',
            },
          ],
        })
        if (prompts.isCancel(res)) return cancel()
        overwrite = res
      } else {
        overwrite = 'no'
      }
    }

    switch (overwrite) {
      case 'yes':
        emptyDir(targetDir)
        break
      case 'no':
        cancel()
        return
    }
  }

  // 3. Get package name
  let packageName = path.basename(path.resolve(targetDir))
  if (!isValidPackageName(packageName)) {
    if (interactive) {
      const packageNameResult = await prompts.text({
        message: 'Package name:',
        defaultValue: toValidPackageName(packageName),
        placeholder: toValidPackageName(packageName),
        validate(dir) {
          if (!isValidPackageName(dir)) {
            return 'Invalid package.json name'
          }
        },
      })
      if (prompts.isCancel(packageNameResult)) return cancel()
      packageName = packageNameResult
    } else {
      packageName = toValidPackageName(packageName)
    }
  }

  // 4. Choose a framework and variant
  let template = argTemplate
  let hasInvalidArgTemplate = false
  if (argTemplate && !TEMPLATES.includes(argTemplate)) {
    template = undefined
    hasInvalidArgTemplate = true
  }
  if (!template) {
    if (interactive) {
      const framework = await prompts.select({
        message: hasInvalidArgTemplate
          ? `"${argTemplate}" isn't a valid template. Please choose from below: `
          : 'Select a framework:',
        options: FRAMEWORKS.map((framework) => {
          const frameworkColor = framework.color
          return {
            label: frameworkColor(framework.display || framework.name),
            value: framework,
          }
        }),
      })
      if (prompts.isCancel(framework)) return cancel()

      const variant = await prompts.select({
        message: 'Select a variant:',
        options: framework.variants.map((variant) => {
          const variantColor = variant.color
          const command = variant.customCommand
            ? getFullCustomCommand(variant.customCommand, pkgInfo).replace(
                / TARGET_DIR$/,
                '',
              )
            : undefined
          return {
            label: variantColor(variant.display || variant.name),
            value: variant.name,
            hint: command,
          }
        }),
      })
      if (prompts.isCancel(variant)) return cancel()

      template = variant
    } else {
      template = 'vanilla-ts'
    }
  }

  const pkgManager = pkgInfo ? pkgInfo.name : 'npm'

  // 5. Ask about immediate install and package manager
  let immediate = argImmediate
  if (immediate === undefined) {
    if (interactive) {
      const immediateResult = await prompts.confirm({
        message: `Install with ${pkgManager} and start now?`,
      })
      if (prompts.isCancel(immediateResult)) return cancel()
      immediate = immediateResult
    } else {
      immediate = false
    }
  }

  const root = path.join(cwd, targetDir)
  fs.mkdirSync(root, { recursive: true })

  // determine template
  let isReactSwc = false
  if (template.includes('-swc')) {
    isReactSwc = true
    template = template.replace('-swc', '')
  }
  let isReactCompiler = false
  if (template.includes('react-compiler')) {
    isReactCompiler = true
    template = template.replace('-compiler', '')
  }

  const { customCommand } =
    FRAMEWORKS.flatMap((f) => f.variants).find((v) => v.name === template) ?? {}

  if (customCommand) {
    const fullCustomCommand = getFullCustomCommand(customCommand, pkgInfo)

    const [command, ...args] = fullCustomCommand.split(' ')
    // we replace TARGET_DIR here because targetDir may include a space
    const replacedArgs = args.map((arg) =>
      arg.replace('TARGET_DIR', () => targetDir),
    )
    const { status } = spawn.sync(command, replacedArgs, {
      stdio: 'inherit',
    })
    process.exit(status ?? 0)
  }

  prompts.log.step(`Scaffolding project in ${root}...`)

  const templateDir = path.resolve(
    fileURLToPath(import.meta.url),
    '../..',
    `template-${template}`,
  )

  const write = (file: string, content?: string) => {
    const targetPath = path.join(root, renameFiles[file] ?? file)
    if (content) {
      fs.writeFileSync(targetPath, content)
    } else if (file === 'index.html') {
      const templatePath = path.join(templateDir, file)
      const templateContent = fs.readFileSync(templatePath, 'utf-8')
      const updatedContent = templateContent.replace(
        /<title>.*?<\/title>/,
        `<title>${packageName}</title>`,
      )
      fs.writeFileSync(targetPath, updatedContent)
    } else {
      copy(path.join(templateDir, file), targetPath)
    }
  }

  const files = fs.readdirSync(templateDir)
  for (const file of files.filter((f) => f !== 'package.json')) {
    write(file)
  }

  const pkg = JSON.parse(
    fs.readFileSync(path.join(templateDir, `package.json`), 'utf-8'),
  )

  pkg.name = packageName

  write('package.json', JSON.stringify(pkg, null, 2) + '\n')

  if (isReactSwc) {
    setupReactSwc(root, template.endsWith('-ts'))
  } else if (isReactCompiler) {
    setupReactCompiler(root, template.endsWith('-ts'))
  }

  if (immediate) {
    install(root, pkgManager)
    start(root, pkgManager)
  } else {
    let doneMessage = ''
    const cdProjectName = path.relative(cwd, root)
    doneMessage += `Done. Now run:\n`
    if (root !== cwd) {
      doneMessage += `\n  cd ${
        cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName
      }`
    }
    doneMessage += `\n  ${getInstallCommand(pkgManager).join(' ')}`
    doneMessage += `\n  ${getRunCommand(pkgManager, 'dev').join(' ')}`
    prompts.outro(doneMessage)
  }
}

function formatTargetDir(targetDir: string) {
  return targetDir.trim().replace(/\/+$/g, '')
}

function copy(src: string, dest: string) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    copyDir(src, dest)
  } else {
    fs.copyFileSync(src, dest)
  }
}

function isValidPackageName(projectName: string) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
    projectName,
  )
}

function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z\d\-~]+/g, '-')
}

function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    const destFile = path.resolve(destDir, file)
    copy(srcFile, destFile)
  }
}

function isEmpty(path: string) {
  const files = fs.readdirSync(path)
  return files.length === 0 || (files.length === 1 && files[0] === '.git')
}

function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') {
      continue
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true })
  }
}

interface PkgInfo {
  name: string
  version: string
}

function pkgFromUserAgent(userAgent: string | undefined): PkgInfo | undefined {
  if (!userAgent) return undefined
  const pkgSpec = userAgent.split(' ')[0]
  const pkgSpecArr = pkgSpec.split('/')
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  }
}

function setupReactSwc(root: string, isTs: boolean) {
  // renovate: datasource=npm depName=@vitejs/plugin-react-swc
  const reactSwcPluginVersion = '4.2.2'

  editFile(path.resolve(root, 'package.json'), (content) => {
    return content.replace(
      /"@vitejs\/plugin-react": ".+?"/,
      `"@vitejs/plugin-react-swc": "^${reactSwcPluginVersion}"`,
    )
  })
  editFile(
    path.resolve(root, `vite.config.${isTs ? 'ts' : 'js'}`),
    (content) => {
      return content.replace('@vitejs/plugin-react', '@vitejs/plugin-react-swc')
    },
  )
  updateReactCompilerReadme(
    root,
    'The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.',
  )
}

function setupReactCompiler(root: string, isTs: boolean) {
  // renovate: datasource=npm depName=babel-plugin-react-compiler
  const reactCompilerPluginVersion = '1.0.0'

  editFile(path.resolve(root, 'package.json'), (content) => {
    const asObject = JSON.parse(content)
    const devDepsEntries = Object.entries(asObject.devDependencies)
    devDepsEntries.push([
      'babel-plugin-react-compiler',
      `^${reactCompilerPluginVersion}`,
    ])
    devDepsEntries.sort()
    asObject.devDependencies = Object.fromEntries(devDepsEntries)
    return JSON.stringify(asObject, null, 2) + '\n'
  })
  editFile(
    path.resolve(root, `vite.config.${isTs ? 'ts' : 'js'}`),
    (content) => {
      return content.replace(
        '  plugins: [react()],',
        `  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],`,
      )
    },
  )
  updateReactCompilerReadme(
    root,
    'The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.\n\nNote: This will impact Vite dev & build performances.',
  )
}

function updateReactCompilerReadme(root: string, newBody: string) {
  editFile(path.resolve(root, `README.md`), (content) => {
    const h2Start = content.indexOf('## React Compiler')
    const bodyStart = content.indexOf('\n\n', h2Start)
    const compilerSectionEnd = content.indexOf('\n## ', bodyStart)
    if (h2Start === -1 || bodyStart === -1 || compilerSectionEnd === -1) {
      console.warn('Could not update compiler section in README.md')
      return content
    }
    return content.replace(
      content.slice(bodyStart + 2, compilerSectionEnd - 1),
      newBody,
    )
  })
}

function editFile(file: string, callback: (content: string) => string) {
  const content = fs.readFileSync(file, 'utf-8')
  fs.writeFileSync(file, callback(content), 'utf-8')
}

function getFullCustomCommand(customCommand: string, pkgInfo?: PkgInfo) {
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm'
  const isYarn1 = pkgManager === 'yarn' && pkgInfo?.version.startsWith('1.')

  return (
    customCommand
      .replace(/^npm create (?:-- )?/, () => {
        // `bun create` uses it's own set of templates,
        // the closest alternative is using `bun x` directly on the package
        if (pkgManager === 'bun') {
          return 'bun x create-'
        }
        // Deno uses `run -A npm:create-` instead of `create` or `init` to also provide needed perms
        if (pkgManager === 'deno') {
          return 'deno run -A npm:create-'
        }
        // pnpm doesn't support the -- syntax
        if (pkgManager === 'pnpm') {
          return 'pnpm create '
        }
        // For other package managers, preserve the original format
        return customCommand.startsWith('npm create -- ')
          ? `${pkgManager} create -- `
          : `${pkgManager} create `
      })
      // Only Yarn 1.x doesn't support `@version` in the `create` command
      .replace('@latest', () => (isYarn1 ? '' : '@latest'))
      .replace(/^npm exec /, () => {
        // Prefer `pnpm dlx`, `yarn dlx`, or `bun x`
        if (pkgManager === 'pnpm') {
          return 'pnpm dlx '
        }
        if (pkgManager === 'yarn' && !isYarn1) {
          return 'yarn dlx '
        }
        if (pkgManager === 'bun') {
          return 'bun x '
        }
        if (pkgManager === 'deno') {
          return 'deno run -A npm:'
        }
        // Use `npm exec` in all other cases,
        // including Yarn 1.x and other custom npm clients.
        return 'npm exec '
      })
  )
}

function getInstallCommand(agent: string) {
  if (agent === 'yarn') {
    return [agent]
  }
  return [agent, 'install']
}

function getRunCommand(agent: string, script: string) {
  switch (agent) {
    case 'yarn':
    case 'pnpm':
    case 'bun':
      return [agent, script]
    case 'deno':
      return [agent, 'task', script]
    default:
      return [agent, 'run', script]
  }
}

init().catch((e) => {
  console.error(e)
})
