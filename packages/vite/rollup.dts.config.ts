import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { type Plugin, defineConfig } from 'rollup'
import dts from 'rollup-plugin-dts'
import { parse } from '@babel/parser'
import type { Node } from '@babel/types'
import { walk } from 'estree-walker'
import MagicString from 'magic-string'

const depTypesDir = new URL('./src/types/', import.meta.url)
const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url)).toString(),
)

export default defineConfig({
  input: './temp/node/index.d.ts',
  output: {
    file: './dist/node/index.d.ts',
    format: 'es',
  },
  external: [
    /^node:*/,
    ...Object.keys(pkg.dependencies),
    // lightningcss types are bundled
    ...Object.keys(pkg.devDependencies).filter((d) => d !== 'lightningcss'),
  ],
  plugins: [patchTypes(), dts({ respectExternal: true })],
  onwarn(warning, warn) {
    // `@internal` props could refer to imported values, but since they are stripped
    // the imported values will be seemingly unused. Ignore these warnings.
    if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return
    warn(warning)
  },
})

/**
 * Patch the types file before passing to dts plugin
 * 1. Resolve `dep-types/*` and `types/*` imports
 * 2. Remove `@internal` declarations
 * 3. Remove unnecessary comments
 * 4. Validate unallowed dependency imports
 */
function patchTypes(): Plugin {
  return {
    name: 'patch-types',
    resolveId(id) {
      // Dep types should be bundled
      if (id.startsWith('dep-types/')) {
        const fileUrl = new URL(
          `./${id.slice('dep-types/'.length)}.d.ts`,
          depTypesDir,
        )
        return fileURLToPath(fileUrl)
      }
      // Ambient types are unbundled and externalized
      if (id.startsWith('types/')) {
        return {
          id: '../../' + (id.endsWith('.js') ? id : id + '.js'),
          external: true,
        }
      }
    },
    transform(code, id) {
      if (id.includes('/node_modules/')) return

      const s = new MagicString(code)
      const ast = parse(code, {
        plugins: ['typescript'],
        sourceType: 'module',
      })

      if (code.includes('@internal')) {
        walk(ast as any, {
          enter(node: any) {
            if (removeInternal(s, node)) {
              this.skip()
            }
          },
        })
      }

      if (ast.comments?.length) {
        for (const comment of ast.comments) {
          if (
            // Remove unnecessary single-line comments
            comment.type === 'CommentLine' ||
            // Remove custom license code
            comment.value.includes('The MIT License')
          ) {
            // @ts-expect-error exists
            s.remove(comment.start, comment.end)
          }
        }
      }

      code = s.toString()

      if (code.includes('@internal')) {
        throw new Error(`Unhandled @internal declarations detected in ${id}`)
      }

      return code
    },
    renderChunk(_, chunk) {
      const deps = new Set(Object.keys(pkg.dependencies))
      // Validate that chunk imports do not import dev deps
      for (const id of chunk.imports) {
        if (
          !id.startsWith('./') &&
          !id.startsWith('../') &&
          !id.startsWith('node:') &&
          !deps.has(id)
        ) {
          // If validation failed, only warn and set exit code 1 so that files
          // are written to disk for inspection, but the build will fail
          this.warn(`${chunk.fileName} imports "${id}" which is not allowed`)
          process.exitCode = 1
        }
      }
    },
  }
}

// Reference: https://github.com/vuejs/core/blob/main/rollup.dts.config.js
function removeInternal(s: MagicString, node: Node): boolean {
  if (
    node.leadingComments &&
    node.leadingComments.some((c) => {
      return c.type === 'CommentBlock' && c.value.includes('@internal')
    })
  ) {
    const n = node as any
    let id: string | undefined
    if (n.id && n.id.type === 'Identifier') {
      id = n.id.name
    } else if (n.key && n.key.type === 'Identifier') {
      id = n.key.name
    }
    if (id) {
      s.overwrite(
        // @ts-expect-error exists
        node.leadingComments[0].start,
        node.end,
        `/* removed internal: ${id} */`,
      )
    } else {
      // @ts-expect-error exists
      s.remove(node.leadingComments[0].start, node.end)
    }
    return true
  }
  return false
}
