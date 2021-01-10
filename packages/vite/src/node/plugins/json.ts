/**
 * https://github.com/rollup/plugins/blob/master/packages/json/src/index.js
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file at
 * https://github.com/rollup/plugins/blob/master/LICENSE
 */

import { createFilter, dataToEsm } from '@rollup/pluginutils'
import { FilterPattern } from '@rollup/pluginutils'
import { Plugin } from 'rollup'

export interface RollupJsonOptions {
  /**
   * All JSON files will be parsed by default,
   * but you can also specifically include files
   */
  include?: FilterPattern
  /**
   * All JSON files will be parsed by default,
   * but you can also specifically exclude files
   */
  exclude?: FilterPattern
  /**
   * For tree-shaking, properties will be declared as variables, using
   * either `var` or `const`.
   * @default false
   */
  preferConst?: boolean
  /**
   * Specify indentation for the generated default export
   * @default '\t'
   */
  indent?: string
  /**
   * Ignores indent and generates the smallest code
   * @default false
   */
  compact?: boolean
  /**
   * Generate a named export for every property of the JSON object
   * @default true
   */
  namedExports?: boolean
}

// Custom json filter for vite
const jsonExtRE = new RegExp(`\\.json($|\\?)`)

export function jsonPlugin(options: RollupJsonOptions = {}): Plugin {
  const filter = createFilter(options.include, options.exclude)
  const indent = 'indent' in options ? options.indent : '\t'

  return {
    name: 'vite:json',

    transform(json, id) {
      if (!jsonExtRE.test(id) || !filter(id)) return null

      try {
        const parsed = JSON.parse(json)
        return {
          code: dataToEsm(parsed, {
            preferConst: options.preferConst,
            compact: options.compact,
            namedExports: options.namedExports,
            indent
          }),
          map: { mappings: '' }
        }
      } catch (e) {
        const errorMessageList = /[\d]/.exec(e.message)
        const position = errorMessageList && parseInt(errorMessageList[0], 10)
        const msg = position
          ? `, invalid JSON syntax found at line ${position}`
          : `.`
        this.error(`Failed to parse JSON file` + msg, e.idx)
      }
    }
  }
}
