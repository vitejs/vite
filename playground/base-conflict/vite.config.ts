import { defineConfig, normalizePath } from 'vite'

const rootPath = normalizePath(import.meta.dirname)
const absoluteRoot = rootPath.startsWith('/') ? rootPath : `/${rootPath}`
const [firstSegment] = absoluteRoot.split('/').filter(Boolean)
const base = firstSegment ? `/${firstSegment}/` : '/'

const VIRTUAL_MODULE_ID = 'absolute-importer'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

const absoluteDepPath = `${rootPath}/src/importee.ts`
export default defineConfig({
  base,
  plugins: [
    {
      name: 'absolute-path-import',
      resolveId(id) {
        if (id === VIRTUAL_MODULE_ID) {
          return RESOLVED_VIRTUAL_MODULE_ID
        }
      },
      load(id) {
        if (id === RESOLVED_VIRTUAL_MODULE_ID) {
          return (
            `import dep from ${JSON.stringify(absoluteDepPath)}\n` +
            `export default dep`
          )
        }
      },
    },
  ],
})
