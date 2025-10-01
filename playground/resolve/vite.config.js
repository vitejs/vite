import path from 'node:path'
import { defaultClientConditions, defineConfig, normalizePath } from 'vite'
import { a } from './config-dep.cjs'

const virtualFile = '@virtual-file'
const virtualId = '\0' + virtualFile

const virtualFile9036 = 'virtual:file-9036.js'
const virtualId9036 = '\0' + virtualFile9036

const customVirtualFile = '@custom-virtual-file'

const generatedContentVirtualFile = '@generated-content-virtual-file'
const generatedContentImports = [
  {
    specifier: normalizePath(
      path.resolve(__dirname, './drive-relative.js').replace(/^[a-zA-Z]:/, ''),
    ),
    elementQuery: '.drive-relative',
  },
  {
    specifier: normalizePath(path.resolve(__dirname, './absolute.js')),
    elementQuery: '.absolute',
  },
  {
    specifier: new URL('file-url.js', import.meta.url),
    elementQuery: '.file-url',
  },
]

export default defineConfig({
  resolve: {
    extensions: ['.mjs', '.js', '.es', '.ts'],
    mainFields: ['browser', 'custom', 'module'],
    conditions: [...defaultClientConditions, 'custom'],
  },
  define: {
    VITE_CONFIG_DEP_TEST: a,
  },
  plugins: [
    {
      name: 'virtual-module',
      resolveId(id) {
        if (id === virtualFile) {
          return virtualId
        }
      },
      load(id) {
        if (id === virtualId) {
          return `export const msg = "[success] from conventional virtual file"`
        }
      },
    },
    {
      name: 'virtual-module-9036',
      resolveId(id) {
        if (id === virtualFile9036) {
          return virtualId9036
        }
      },
      load(id) {
        if (id === virtualId9036) {
          return `export const msg = "[success] from virtual file #9036"`
        }
      },
    },
    {
      name: 'custom-resolve',
      resolveId(id) {
        if (id === customVirtualFile) {
          return id
        }
      },
      load(id) {
        if (id === customVirtualFile) {
          return `export const msg = "[success] from custom virtual file"`
        }
      },
    },
    {
      name: 'generated-content',
      resolveId(id) {
        if (id === generatedContentVirtualFile) {
          return id
        }
      },
      load(id) {
        if (id === generatedContentVirtualFile) {
          const tests = generatedContentImports
            .map(
              ({ specifier, elementQuery }, i) =>
                `import content${i} from ${JSON.stringify(specifier)}\n` +
                `text(${JSON.stringify(elementQuery)}, content${i})`,
            )
            .join('\n')

          return (
            'function text(selector, text) {\n' +
            '  document.querySelector(selector).textContent = text\n' +
            '}\n\n' +
            tests
          )
        }
      },
    },
    {
      name: 'resolve to non normalized absolute',
      async resolveId(id) {
        if (id !== '@non-normalized') return
        return this.resolve(__dirname + '//non-normalized')
      },
    },
  ],
  optimizeDeps: {
    include: [
      '@vitejs/test-resolve-exports-with-module-condition-required',
      '@vitejs/test-require-pkg-with-module-field',
      '@vitejs/test-resolve-sharp-dir',
    ],
  },
  build: {
    copyPublicDir: false,
  },
})
