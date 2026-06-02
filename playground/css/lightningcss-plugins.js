import path from 'node:path'
import { normalizePath } from 'vite'
import { bundle as bundleWithLightningCss } from 'lightningcss'
import { globSync } from 'tinyglobby'

/**
 * @param {string} filename
 * @returns {import('lightningcss').StyleSheet}
 *
 * based on https://github.com/sardinedev/lightningcss-plugins/blob/9fb379486e402a4b4b8950d09e655b4cbf8a118b/packages/global-custom-queries/src/globalCustomQueries.ts#L9-L29
 * https://github.com/sardinedev/lightningcss-plugins/blob/main/LICENSE
 */
function obtainLightningCssAst(filename) {
  let ast
  try {
    bundleWithLightningCss({
      filename,
      visitor: {
        StyleSheet(stylesheet) {
          ast = stylesheet
        },
      },
    })
    return ast
  } catch (error) {
    throw Error(`failed to obtain lightning css AST`, { cause: error })
  }
}

/** @returns {import('lightningcss').Visitor} */
export function testDirDep() {
  /** @type {string[]} */
  let currentStyleSheetSources
  return {
    StyleSheet(stylesheet) {
      currentStyleSheetSources = stylesheet.sources
    },
    Rule: {
      unknown: {
        test(rule) {
          const location = rule.loc
          const from = currentStyleSheetSources[location.source_index]
          const pattern = normalizePath(
            path.resolve(path.dirname(from), './glob-dep/**/*.css'),
          )
          // FIXME: there's no way to add a dependency
          const files = globSync(pattern, {
            expandDirectories: false,
            absolute: true,
          })
          return files.flatMap((file) => obtainLightningCssAst(file).rules)
        },
      },
    },
  }
}

/** @returns {import('lightningcss').Visitor} */
export function testSourceInput() {
  /** @type {string[]} */
  let currentStyleSheetSources
  return {
    StyleSheet(stylesheet) {
      currentStyleSheetSources = stylesheet.sources
    },
    Rule: {
      unknown: {
        'source-input': (rule) => {
          const location = rule.loc
          const from = currentStyleSheetSources[location.source_index]
          return [
            {
              type: 'style',
              value: {
                // .source-input::before
                selectors: [
                  [
                    { type: 'class', name: 'source-input' },
                    { type: 'pseudo-element', kind: 'before' },
                  ],
                ],
                // content: ${JSON.stringify(from)};
                declarations: {
                  declarations: [
                    {
                      property: 'custom',
                      value:
                        /** @satisfies {import('lightningcss').CustomProperty} */ ({
                          name: 'content',
                          value: [
                            {
                              type: 'token',
                              value: { type: 'string', value: from },
                            },
                          ],
                        }),
                    },
                  ],
                },
                loc: rule.loc,
              },
            },
          ]
        },
      },
    },
  }
}

/**
 * really simplified implementation of https://github.com/postcss/postcss-nested
 *
 * @returns {import('lightningcss').Visitor}
 */
export function nestedLikePlugin() {
  return {
    Rule: {
      style(rule) {
        // NOTE: multiple selectors are not supported
        if (rule.value.selectors.length > 1) {
          return
        }
        const parentSelector = rule.value.selectors[0]

        const nestedRules = rule.value.rules
        /** @type {import('lightningcss').Rule[]} */
        const additionalRules = []
        if (nestedRules) {
          const filteredNestedRules = []
          for (const nestedRule of nestedRules) {
            if (nestedRule.type === 'style') {
              const selectors = nestedRule.value.selectors
              // NOTE: multiple selectors are not supported
              if (selectors.length === 1) {
                const selector = selectors[0]
                if (
                  selector.length >= 2 &&
                  selector[0].type === 'nesting' &&
                  selector[1].type === 'type'
                ) {
                  const lastParentSelectorComponent =
                    parentSelector[parentSelector.length - 1]
                  if ('name' in lastParentSelectorComponent) {
                    const newSelector = [
                      ...parentSelector.slice(0, -1),
                      {
                        ...lastParentSelectorComponent,
                        name:
                          lastParentSelectorComponent.name + selector[1].name,
                      },
                    ]
                    additionalRules.push({
                      type: 'style',
                      value: {
                        selectors: [newSelector],
                        declarations: nestedRule.value.declarations,
                        loc: nestedRule.value.loc,
                      },
                    })
                    continue
                  }
                }
              }
            }
            filteredNestedRules.push(nestedRule)
          }
          rule.value.rules = filteredNestedRules
        }
        return [rule, ...additionalRules]
      },
    },
  }
}

/** @returns {import('lightningcss').Visitor} */
export function testInjectUrl() {
  return {
    Rule: {
      unknown: {
        'inject-url': (rule) => {
          return [
            {
              type: 'style',
              value: {
                selectors: [[{ type: 'class', name: 'inject-url' }]],
                declarations: {
                  declarations: [
                    {
                      property: 'background-image',
                      value: [
                        {
                          type: 'url',
                          value: {
                            url: '=/ok.png',
                            loc: rule.loc,
                          },
                        },
                      ],
                    },
                  ],
                },
                loc: rule.loc,
              },
            },
          ]
        },
      },
    },
  }
}
