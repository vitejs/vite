import fs from 'node:fs'
import module from 'node:module'
import { defineConfig } from 'vite'
const require = module.createRequire(import.meta.url)

export default defineConfig({
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
  resolve: {
    dedupe: ['react'],
    alias: {
      'node:url': 'url',
      '@vitejs/test-dep-alias-using-absolute-path':
        require.resolve('@vitejs/test-dep-alias-using-absolute-path'),
    },
  },
  optimizeDeps: {
    include: [
      '@vitejs/test-dep-linked-include',
      '@vitejs/test-nested-exclude > @vitejs/test-nested-include',
      '@vitejs/test-dep-cjs-external-package-omit-js-suffix',
      // will throw if optimized (should log warning instead)
      '@vitejs/test-non-optimizable-include',
      '@vitejs/test-dep-optimize-exports-with-glob/**/*',
      '@vitejs/test-dep-optimize-exports-with-root-glob/**/*.js',
      '@vitejs/test-dep-optimize-with-glob/**/*.js',
      '@vitejs/test-dep-cjs-with-external-deps',
      '@vitejs/test-dep-cjs-with-es-module-flag',
      // only referenced by the import that injectImportIntoOptimizedDep()
      // adds at serve time, so the scanner can never discover it
      '@vitejs/test-dep-cjs-for-injected-import',
    ],
    exclude: [
      '@vitejs/test-nested-exclude',
      '@vitejs/test-dep-non-optimized',
      '@vitejs/test-dep-esm-external',
      'stream',
    ],
    rolldownOptions: {
      plugins: [
        {
          name: 'replace-a-file',
          load(id) {
            if (/dep-esbuild-plugin-transform(?:\\|\/)index\.js$/.test(id)) {
              return `export const hello = () => 'Hello from an esbuild plugin'`
            }
          },
        },
      ],
    },
    entries: ['index.html', 'unused-split-entry.js'],
  },

  build: {
    // to make tests faster
    minify: false,
  },

  plugins: [
    testVue(),
    notjs(),
    virtualModulePlugin(),
    injectImportIntoOptimizedDep(),
    {
      name: 'test-astro',
      transform(code, id) {
        if (id.endsWith('.astro')) {
          code = `export default {}`
          return { code }
        }
      },
    },
  ],
})

// Handles Test.vue in dep-linked-include package
function testVue() {
  return {
    name: 'testvue',
    transform(code, id) {
      if (id.includes('dep-linked-include/Test.vue')) {
        return {
          code: `
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Test',
  render() {
    return '[success] rendered from Vue'
  }
})
`.trim(),
        }
      }

      // fallback to empty module for other vue files
      if (!id.startsWith('\0') && id.endsWith('.vue')) {
        return { code: `export default {}` }
      }
    },
  }
}

// Handles .notjs file, basically remove wrapping <notjs> and </notjs> tags
function notjs() {
  return {
    name: 'notjs',
    config() {
      return {
        optimizeDeps: {
          extensions: ['.notjs'],
          rolldownOptions: {
            plugins: [
              {
                name: 'esbuild-notjs',
                load: {
                  filter: { id: /\.notjs$/ },
                  handler(id) {
                    let contents = fs.readFileSync(id, 'utf-8')
                    contents = contents
                      .replace('<notjs>', '')
                      .replace('</notjs>', '')
                    return contents
                  },
                },
              },
            ],
          },
        },
      }
    },
    transform(code, id) {
      if (id.endsWith('.notjs')) {
        code = code.replace('<notjs>', '').replace('</notjs>', '')
        return { code }
      }
    },
  }
}

// Injects a named import of a CJS dep into the served output of an optimized
// dep, like @rollup/plugin-inject does when providing `Buffer` / `process`
function injectImportIntoOptimizedDep() {
  return {
    name: 'inject-import-into-optimized-dep',
    transform(code, id) {
      if (
        /\.vite[\\/]deps[\\/].*test-dep-with-injected-import/.test(id) &&
        !code.includes('test-dep-cjs-for-injected-import')
      ) {
        return {
          code:
            `import { msg as injectedMsg } from '@vitejs/test-dep-cjs-for-injected-import';\n` +
            code,
        }
      }
    },
  }
}

function virtualModulePlugin() {
  const virtualModuleId = 'virtual:test-virtual-file/Foo.vue'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  return {
    name: 'test-virtual-module',
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `export default { name: 'VirtualComponent' }`
      }
    },
  }
}
