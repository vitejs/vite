import path from 'node:path'
import { describe, expect, test } from 'vitest'
import {
  ScanEnvironment,
  commentRE,
  importsRE,
  scanImports,
  scriptRE,
} from '../optimizer/scan'
import { multilineCommentsRE, singlelineCommentsRE } from '../utils'
import { createServer, createServerModuleRunner, resolveConfig } from '..'

describe('optimizer-scan:script-test', () => {
  const execScriptRE = (input: string) => {
    const result = scriptRE.exec(input)
    scriptRE.lastIndex = 0
    return result
  }

  const scriptContent = `import { defineComponent } from 'vue'
      import ScriptDevelopPane from './ScriptDevelopPane.vue';
      export default defineComponent({
        components: {
          ScriptDevelopPane
        }
      })`

  test('component return value test', () => {
    const [, tsOpenTag, tsContent] = execScriptRE(
      `<script lang="ts">${scriptContent}</script>`,
    )!
    expect(tsOpenTag).toEqual('<script lang="ts">')
    expect(tsContent).toEqual(scriptContent)

    const [, openTag, content] = execScriptRE(
      `<script>${scriptContent}</script>`,
    )!
    expect(openTag).toEqual('<script>')
    expect(content).toEqual(scriptContent)
  })

  test('include comments test', () => {
    const ret = execScriptRE(
      `<template>
        <!--  <script >var test1 = null</script> -->
        <!--  <script >var test2 = null</script> -->
      </template>`.replace(commentRE, ''),
    )
    expect(ret).toEqual(null)
  })

  test('components with script keyword test', () => {
    let ret = execScriptRE(`<template><script-develop-pane/></template>`)
    expect(ret).toBe(null)

    ret = execScriptRE(
      `<template><script-develop-pane></script-develop-pane></template>`,
    )
    expect(ret).toBe(null)

    ret = execScriptRE(
      `<template><script-develop-pane  > content </script-develop-pane></template>`,
    )
    expect(ret).toBe(null)
  })

  test('ordinary script tag test', () => {
    const [, tag, content] = execScriptRE(`<script  >var test = null</script>`)!
    expect(tag).toEqual('<script  >')
    expect(content).toEqual('var test = null')

    const [, tag1, content1] = execScriptRE(`<script>var test = null</script>`)!
    expect(tag1).toEqual('<script>')
    expect(content1).toEqual('var test = null')
  })

  test('imports regex should work', () => {
    const shouldMatchArray = [
      `import 'vue'`,
      `import { foo } from 'vue'`,
      `import foo from 'vue'`,
      `;import foo from 'vue'`,
      `   import foo from 'vue'`,
      `import { foo
      } from 'vue'`,
      `import bar, { foo } from 'vue'`,
      `import foo from 'vue';`,
      `*/ import foo from 'vue';`,
      `import foo from 'vue';//comment`,
      `import foo from 'vue';/*comment
      */`,
      // Skipped, false negatives with current regex
      // `import typescript from 'typescript'`,
      // import type, {foo} from 'vue'
    ]

    shouldMatchArray.forEach((str) => {
      importsRE.lastIndex = 0
      expect(importsRE.exec(str)![1]).toEqual("'vue'")
    })

    const shouldFailArray = [
      `testMultiline("import", {
        body: "ok" });`,
      `//;import foo from 'vue'`,
      `import type { Bar } from 'foo'`,
      `import type{ Bar } from 'foo'`,
      `import type Bar from 'foo'`,
    ]
    shouldFailArray.forEach((str) => {
      importsRE.lastIndex = 0
      expect(importsRE.test(str)).toBe(false)
    })
  })

  test('script comments test', () => {
    multilineCommentsRE.lastIndex = 0
    let ret = `/*
      export default { }
      */`.replace(multilineCommentsRE, '')
    expect(ret).not.toContain('export default')

    singlelineCommentsRE.lastIndex = 0
    ret = `//export default { }`.replace(singlelineCommentsRE, '')
    expect(ret).not.toContain('export default')
  })
})

test('scan svelte', async () => {
  const config = await resolveConfig(
    {
      configFile: false,
      root: path.join(import.meta.dirname, 'fixtures', 'scan-svelte'),
      optimizeDeps: {
        include: [],
        entries: ['./svelte-snippet.svelte'],
        extensions: ['.svelte'],
      },
    },
    'serve',
  )
  const environment = new ScanEnvironment('client', config)
  await environment.init()
  const { result } = scanImports(environment)
  await result
})

test('scan jsx-runtime', async (ctx) => {
  const server = await createServer({
    configFile: false,
    logLevel: 'error',
    root: path.join(import.meta.dirname, 'fixtures', 'scan-jsx-runtime'),
    environments: {
      client: {
        // silence client optimizer
        optimizeDeps: {
          noDiscovery: true,
        },
      },
      ssr: {
        resolve: {
          noExternal: true,
        },
        optimizeDeps: {
          force: true,
          noDiscovery: false,
          entries: ['./entry-jsx.tsx', './entry-no-jsx.js'],
        },
      },
    },
  })

  // start server to ensure optimizer run
  await server.listen()
  ctx.onTestFinished(() => server.close())

  const runner = createServerModuleRunner(server.environments.ssr, {
    hmr: { logger: false },
  })

  // flush initial optimizer by importing any file
  await runner.import('./entry-no-jsx.js')

  // verify jsx won't trigger optimizer re-run
  const mod1 = await runner.import('./entry-jsx.js')
  const mod2 = await runner.import('./entry-jsx.js')
  expect((globalThis as any).__test_scan_jsx_runtime).toBe(1)
  expect(mod1).toBe(mod2)
})
