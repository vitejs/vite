import { traverseEsModules, urlResolver } from 'es-module-traversal'
import { once } from 'events'
import execa from 'execa'
import fs from 'fs-extra'
import path from 'path'
import { URL } from 'url'
import WebSocket from 'ws'
import { UserConfig } from '../dist/node/config'
import { createServer } from '../dist/node/server'
import playgroundConfig from '../playground/vite.config'

const tempDir = path.resolve('temp')
const fixtureDir = path.resolve('playground')
const PORT = 4000

jest.setTimeout(100000)

const config: UserConfig = {
  ...playgroundConfig,
  alias: {
    alias: '/alias/aliased',
    '/@alias/': path.resolve(tempDir, 'alias/aliased-dir')
  },
  port: PORT,
  root: tempDir
}

type TestCase = {
  name: string
  path: string
  expectedMessagesCount?: number
  replacer: (content: string) => string
}

const testCases: TestCase[] = [
  {
    name: 'simple vue file',
    path: 'hmr/TestHmr.vue',
    expectedMessagesCount: 1,
    replacer: (content) => {
      return content.replace('</script>', '\n</script>')
    }
  },
  {
    name: 'vue js propagation',
    path: 'hmr/testHmrPropagation.js',
    expectedMessagesCount: 1,
    replacer: (content) => {
      return content.replace('</script>', '\n</script>')
    }
  },
  {
    name: 'vue dynamic import propagation',
    path: 'hmr/testHmrPropagationDynamicImport.js',
    expectedMessagesCount: 1,
    replacer: (content) => {
      return content + '\n\n'
    }
  },
  {
    name: 'vue manual hmr',
    path: 'hmr/testHmrManual.js',
    expectedMessagesCount: 1,
    replacer: (content) => {
      return content + '\n\n'
    }
  },
  {
    name: 'vue alias hmr',
    path: 'alias/aliased/index.js',
    expectedMessagesCount: 1,
    replacer: (content) => {
      return content + '\n\n'
    }
  },
  {
    name: 'vue css import',
    path: 'css-@import/testCssAtImportFromScript.css',
    expectedMessagesCount: 1,
    replacer: (content) => {
      return content + '\n\n'
    }
  },
  {
    name: 'vue css modules import',
    path: 'css-@import/testCssModuleAtImportFromScript.module.css',
    expectedMessagesCount: 2,
    replacer: (content) => {
      return content + '\n\n'
    }
  },
  {
    name: 'vue css style @import hmr',
    path: 'css-@import/testCssAtImportFromStyle.css',
    expectedMessagesCount: 1,
    replacer: (content) => {
      return content + '\n\n'
    }
  },
  {
    name: 'vue css style @import modules hmr',
    path: 'css-@import/testCssModuleAtImportFromStyle.module.css',
    expectedMessagesCount: 1,
    replacer: (content) => {
      return content + '\n\n'
    }
  },
  {
    name: 'css @import',
    path: 'css-@import/imported.css',
    expectedMessagesCount: 1,
    replacer: (content) => {
      return content + '\n\n'
    }
  }
]

beforeAll(async () => {
  try {
    await fs.remove(tempDir)
  } catch (e) {}
  await fs.ensureDir(tempDir)
  await fs.copy(fixtureDir, tempDir, {
    filter: (file) => !/dist|node_modules/.test(file)
  })
  await execa('yarn', { cwd: tempDir, stdio: 'inherit' })
  await execa('yarn', {
    cwd: path.join(tempDir, 'optimize-linked'),
    stdio: 'inherit'
  })
})

afterAll(async () => {
  try {
    await fs.remove(tempDir)
  } catch (e) {}
})

describe('playground hmr', () => {
  const baseUrl = `http://localhost:${PORT}`

  const root = tempDir

  let server
  beforeAll(async () => {
    server = createServer(config)
    server.listen(PORT)
    await once(server, 'listening')
    // console.log('sleeping')
    // await sleep(1000000 * 1000)
  })
  afterAll(() => {
    server.close()
  })

  for (let testCase of testCases) {
    test(testCase.name, async () => {
      const traversedFiles = await traverseEsModules({
        entryPoints: [new URL('/main.js', baseUrl).toString()],
        resolver: urlResolver({
          root,
          baseUrl
        })
      })
      // console.log(traversedFiles.map((x) => x.importPath))
      const messages = await getWsMessages({
        doing: async () => {
          await updateFile(path.resolve(root, testCase.path), testCase.replacer)
        },
        expectedMessagesCount: testCase.expectedMessagesCount
      })
      expect(messages.map(normalizeHmrMessage)).toMatchSnapshot()
    })
  }
})

async function updateFile(compPath, replacer) {
  try {
    const content = await fs.readFile(compPath, 'utf-8')
    await fs.writeFile(compPath, replacer(content))
  } catch (e) {
    throw new Error(`could not update ${compPath}: ${e}`)
  }
}

async function getWsMessages({
  doing,
  expectedMessagesCount = Infinity,
  timeout = 500,
  port = PORT
}) {
  const ws = new WebSocket(`http://localhost:${port}`, 'vite-hmr')
  await once(ws, 'open')
  await doing()
  const messages = []
  ws.addEventListener('message', ({ data }) => {
    const payload = JSON.parse(data)
    if (payload.type === 'connected') return
    if (payload.type === 'multi') {
      return messages.push(...payload.updates)
    }
    return messages.push(payload)
  })
  await Promise.race([
    waitUntil(() => messages.length === expectedMessagesCount),
    sleep(timeout)
  ])
  ws.close()
  await once(ws, 'close')
  return messages
}

const sleep = (n) => new Promise((r) => setTimeout(r, n))

async function waitUntil(check) {
  while (!check()) {
    await sleep(50)
  }
}

const normalizeHmrMessage = (message) => {
  const ignoreKeys = ['timestamp']
  const validKeys = Object.keys(message).filter((k) => !ignoreKeys.includes(k))
  return Object.assign({}, ...validKeys.map((k) => ({ [k]: message[k] })))
}
