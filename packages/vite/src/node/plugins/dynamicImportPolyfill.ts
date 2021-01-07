import MagicString from 'magic-string'
import { ResolvedConfig } from '..'
import { Plugin } from '../plugin'

export const polyfillId = 'vite/dynamic-import-polyfill'
const polyfillPlaceholder = `__DYANMIC_IMPORT_POLYFILL__()`

export function dynamicImportPolyfillPlugin(config: ResolvedConfig): Plugin {
  const skip = config.command === 'serve' || config.build.ssr
  let polyfillLoaded = false
  const polyfillString =
    `${__dynamic_import_polyfill__.toString()};` +
    `__dynamic_import_polyfill__(${JSON.stringify(config.build.base)});`

  return {
    name: 'vite:dynamic-import-polyfill',
    resolveId(id) {
      if (id === polyfillId) {
        return id
      }
    },
    load(id) {
      if (id === polyfillId) {
        if (skip) {
          return ''
        }
        polyfillLoaded = true
        // return a placeholder here and defer the injection to renderChunk
        // so that we can selectively skip the injection based on output format
        return polyfillPlaceholder
      }
    },

    renderDynamicImport({ format }) {
      if (skip || format !== 'es') {
        return null
      }
      if (!polyfillLoaded) {
        throw new Error(
          `Vite's dynamic import polyfill is enabled but was never imported. This ` +
            `should only happen when using custom non-html rollup inputs. Make ` +
            `sure to add \`import "${polyfillId}"\` as the first statement in ` +
            `your custom entry.`
        )
      }
      return {
        left: '__import__(',
        right: ')'
      }
    },

    renderChunk(code, chunk, { format }) {
      if (skip) {
        return null
      }
      if (!chunk.facadeModuleId) {
        return null
      }
      const i = code.indexOf(polyfillPlaceholder)
      if (i < 0) {
        return null
      }
      // if format is not ES, simply empty it
      const replacement = format === 'es' ? polyfillString : ''
      if (config.build.sourcemap) {
        const s = new MagicString(code)
        s.overwrite(i, i + polyfillPlaceholder.length, replacement)
        return {
          code: s.toString(),
          map: s.generateMap({ hires: true })
        }
      } else {
        return {
          code: code.replace(polyfillPlaceholder, replacement),
          map: null
        }
      }
    }
  }
}

/**
The following polyfill function is meant to run in the browser and adapted from
https://github.com/GoogleChromeLabs/dynamic-import-polyfill

MIT License

Copyright (c) 2018 uupaa and 2019 Google LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
*/

declare const self: any
declare const location: any
declare const document: any
declare const URL: any
declare const Blob: any

function __dynamic_import_polyfill__(
  modulePath = '.',
  importFunctionName = '__import__'
) {
  try {
    self[importFunctionName] = new Function('u', `return import(u)`)
  } catch (error) {
    const baseURL = new URL(modulePath, location)
    const cleanup = (script: any) => {
      URL.revokeObjectURL(script.src)
      script.remove()
    }

    self[importFunctionName] = (url: string) =>
      new Promise((resolve, reject) => {
        const absURL = new URL(url, baseURL)

        // If the module has already been imported, resolve immediately.
        if (self[importFunctionName].moduleMap[absURL]) {
          return resolve(self[importFunctionName].moduleMap[absURL])
        }

        const moduleBlob = new Blob(
          [
            `import * as m from '${absURL}';`,
            `${importFunctionName}.moduleMap['${absURL}']=m;`
          ],
          { type: 'text/javascript' }
        )

        const script = Object.assign(document.createElement('script'), {
          type: 'module',
          src: URL.createObjectURL(moduleBlob),
          onerror() {
            reject(new Error(`Failed to import: ${url}`))
            cleanup(script)
          },
          onload() {
            resolve(self[importFunctionName].moduleMap[absURL])
            cleanup(script)
          }
        })

        document.head.appendChild(script)
      })

    self[importFunctionName].moduleMap = {}
  }
}
