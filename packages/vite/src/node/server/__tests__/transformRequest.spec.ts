import { resolve } from 'path'
import { createServer } from '../index'

const ENTRY_MODULE_URL = '/entry.js'
const DEPENDENCY_MODULE_PATH = resolve(__dirname, './fixtures/dependency.js')

/**
 * Construct a simple dependency chain:
 * entry.js -> <virtual module> -> dependency.js
 *
 * The test will check for integrity in the module graph after a request is transformed.
 */
test('virtual modules participate in a continuous module graph', async () => {
  const viteServer = await createServer({
    root: resolve(__dirname, 'fixtures'),
    plugins: [
      {
        name: 'virtual-module-test-plugin',
        resolveId(id) {
          if (id === 'virtual:a-module') {
            return '\0virtual:a-module'
          }
        },
        load(id) {
          if (id === '\0virtual:a-module') {
            return `import { foo as fooReexported } from '${DEPENDENCY_MODULE_PATH}';\nexport { fooReexported };`
          }
        }
      }
    ]
  })

  await viteServer.transformRequest(ENTRY_MODULE_URL)

  // Wait for all requests to finish
  while (viteServer._pendingRequests.size) {
    await Promise.all(
      Array.from(viteServer._pendingRequests.values()).map(
        (entry) => entry.request
      )
    )
  }

  const entry = (await viteServer.moduleGraph.getModuleByUrl(ENTRY_MODULE_URL))!
  expect(entry).toBeTruthy()

  // Find each link in the import chain to ensure the graph is contiguous
  ;['virtual:a-module', 'dependency.js'].reduce((module, url) => {
    const child = Array.from(module.importedModules.entries()).find(
      ([module]) => module.url.includes(url)
    )?.[0]

    expect(child).toBeTruthy()

    return child!
  }, entry)
})
