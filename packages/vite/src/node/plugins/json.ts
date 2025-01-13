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
   * @default 'auto'
   */
  stringify?: boolean | 'auto'
}

// Custom json filter for vite
const jsonExtRE = /\.json(?:$|\?)(?!commonjs-(?:proxy|external))/

const jsonObjRE = /^\s*\{/

const jsonLangs = `\\.(?:json|json5)(?:$|\\?)`
const jsonLangRE = new RegExp(jsonLangs)
export const isJSONRequest = (request: string): boolean =>
  jsonLangRE.test(request)

export function jsonPlugin(
  options: Required<JsonOptions>,
  isBuild: boolean,
): Plugin {
  return {
    name: 'vite:json',

    transform(json, id) {
      if (!jsonExtRE.test(id)) return null
      if (SPECIAL_QUERY_RE.test(id)) return null

      json = stripBomTag(json)

      try {
        if (options.stringify !== false) {
          if (options.namedExports && jsonObjRE.test(json)) {
            const parsed = JSON.parse(json)
            const keys = Object.keys(parsed)

            let code = ''
            let defaultObjectCode = '{\n'
            for (const key of keys) {
              if (key === makeLegalIdentifier(key)) {
                code += `export const ${key} = ${serializeValue(parsed[key])};\n`
                defaultObjectCode += `  ${key},\n`
              } else {
                defaultObjectCode += `  ${JSON.stringify(key)}: ${serializeValue(parsed[key])},\n`
              }
            }
            defaultObjectCode += '}'

            code += `export default ${defaultObjectCode};\n`
            return {
              code,
              map: { mappings: '' },
            }
          }

          if (
            options.stringify === true ||
            // use 10kB as a threshold for 'auto'
            // https://v8.dev/blog/cost-of-javascript-2019#:~:text=A%20good%20rule%20of%20thumb%20is%20to%20apply%20this%20technique%20for%20objects%20of%2010%20kB%20or%20larger
            json.length > 10 * 1000
          ) {
            // during build, parse then double-stringify to remove all
            // unnecessary whitespaces to reduce bundle size.
            if (isBuild) {
              json = JSON.stringify(JSON.parse(json))
            }

            return {
              code: `export default /* #__PURE__ */ JSON.parse(${JSON.stringify(json)})`,
              map: { mappings: '' },
            }
          }
        }

        return {
          code: dataToEsm(JSON.parse(json), {
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

function serializeValue(value: unknown): string {
  const valueAsString = JSON.stringify(value)
  // use 10kB as a threshold
  // https://v8.dev/blog/cost-of-javascript-2019#:~:text=A%20good%20rule%20of%20thumb%20is%20to%20apply%20this%20technique%20for%20objects%20of%2010%20kB%20or%20larger
  if (
    typeof value === 'object' &&
    value != null &&
    valueAsString.length > 10 * 1000
  ) {
    return `/* #__PURE__ */ JSON.parse(${JSON.stringify(valueAsString)})`
  }
  return valueAsString
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
