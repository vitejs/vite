/**
 * https://github.com/rollup/plugins/blob/master/packages/json/src/index.js
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file at
 * https://github.com/rollup/plugins/blob/master/LICENSE
 */

import { dataToEsm, makeLegalIdentifier } from '@rollup/pluginutils'
import { SPECIAL_QUERY_RE } from '../constants'
import type { Plugin } from '../plugin'
import { stripBomTag } from '../utils'

export interface JsonOptions {
  /**
   * Generate a named export for every property of the JSON object
   * @default true
   */
  namedExports?: boolean
  /**
   * Generate performant output as JSON.parse("stringified").
   *
   * When set to 'auto', the data will be stringified only if the data is bigger than 10kB.
   * @default false
   */
  stringify?: boolean | 'auto'
}

// Custom json filter for vite
const jsonExtRE = /\.json(?:$|\?)(?!commonjs-(?:proxy|external))/

const jsonLangs = `\\.(?:json|json5)(?:$|\\?)`
const jsonLangRE = new RegExp(jsonLangs)
export const isJSONRequest = (request: string): boolean =>
  jsonLangRE.test(request)

export function jsonPlugin(
  options: JsonOptions = {},
  isBuild: boolean,
): Plugin {
  return {
    name: 'vite:json',

    transform(json, id) {
      if (!jsonExtRE.test(id)) return null
      if (SPECIAL_QUERY_RE.test(id)) return null

      json = stripBomTag(json)

      try {
        const stringify =
          options.stringify === true ||
          // use 10kB as a threshold
          // https://v8.dev/blog/cost-of-javascript-2019#:~:text=A%20good%20rule%20of%20thumb%20is%20to%20apply%20this%20technique%20for%20objects%20of%2010%20kB%20or%20larger
          (options.stringify === 'auto' && json.length >= 10 * 1000)

        const parsed = JSON.parse(json)

        if (stringify) {
          const contentCode = isBuild
            ? // during build, parse then double-stringify to remove all
              // unnecessary whitespaces to reduce bundle size.
              `JSON.parse(${JSON.stringify(JSON.stringify(parsed))})`
            : `JSON.parse(${JSON.stringify(json)})`

          let code: string
          if (options.namedExports) {
            let defaultKey = 'default_'
            const keys = Object.keys(parsed)
            const keysSet = new Set(keys)
            while (keysSet.has(defaultKey)) {
              defaultKey += '_'
            }

            code = `const ${defaultKey} = ${contentCode};\nexport default default_;\n`
            for (const key of keys) {
              if (key === makeLegalIdentifier(key)) {
                code += `export const ${key} = ${defaultKey}.${key};\n`
              }
            }
          } else {
            code = `export default ${contentCode}`
          }

          return {
            code,
            map: { mappings: '' },
          }
        }

        return {
          code: dataToEsm(parsed, {
            preferConst: true,
            namedExports: options.namedExports,
          }),
          map: { mappings: '' },
        }
      } catch (e) {
        const position = extractJsonErrorPosition(e.message, json.length)
        const msg = position
          ? `, invalid JSON syntax found at position ${position}`
          : `.`
        this.error(`Failed to parse JSON file` + msg, position)
      }
    },
  }
}

export function extractJsonErrorPosition(
  errorMessage: string,
  inputLength: number,
): number | undefined {
  if (errorMessage.startsWith('Unexpected end of JSON input')) {
    return inputLength - 1
  }

  const errorMessageList = /at position (\d+)/.exec(errorMessage)
  return errorMessageList
    ? Math.max(parseInt(errorMessageList[1], 10) - 1, 0)
    : undefined
}
