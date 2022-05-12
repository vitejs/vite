import type * as babelCore from '@babel/core'
import type { PluginItem, types as t } from '@babel/core'

type RestoredJSX = [result: t.File | null | undefined, isCommonJS: boolean]

let babelRestoreJSX: Promise<PluginItem> | undefined

const jsxNotFound: RestoredJSX = [null, false]

/** Restore JSX from `React.createElement` calls */
export async function restoreJSX(
  babel: typeof babelCore,
  code: string,
  filename: string
): Promise<RestoredJSX> {
  // Avoid parsing the optimized react-dom since it will never
  // contain compiled JSX and it's a pretty big file (800kb).
  if (filename.includes('/.vite/react-dom.js')) {
    return jsxNotFound
  }

  const [reactAlias, isCommonJS] = parseReactAlias(code)

  if (!reactAlias) {
    return jsxNotFound
  }

  let hasCompiledJsx = false

  const fragmentPattern = `\\b${reactAlias}\\.Fragment\\b`
  const createElementPattern = `\\b${reactAlias}\\.createElement\\(\\s*([A-Z"'][\\w$.]*["']?)`

  // Replace the alias with "React" so JSX can be reverse compiled.
  code = code
    .replace(new RegExp(fragmentPattern, 'g'), () => {
      hasCompiledJsx = true
      return 'React.Fragment'
    })
    .replace(new RegExp(createElementPattern, 'g'), (original, component) => {
      if (/^[a-z][\w$]*$/.test(component)) {
        // Take care not to replace the alias for `createElement` calls whose
        // component is a lowercased variable, since the `restoreJSX` Babel
        // plugin leaves them untouched.
        return original
      }
      hasCompiledJsx = true
      return (
        'React.createElement(' +
        // Assume `Fragment` is equivalent to `React.Fragment` so modules
        // that use `import {Fragment} from 'react'` are reverse compiled.
        (component === 'Fragment' ? 'React.Fragment' : component)
      )
    })

  if (!hasCompiledJsx) {
    return jsxNotFound
  }

  babelRestoreJSX ||= import('./babel-restore-jsx')

  const result = await babel.transformAsync(code, {
    babelrc: false,
    configFile: false,
    ast: true,
    code: false,
    filename,
    parserOpts: {
      plugins: ['jsx']
    },
    // @ts-ignore
    plugins: [(await babelRestoreJSX).default]
  })

  return [result?.ast, isCommonJS]
}

function parseReactAlias(
  code: string
): [alias: string | undefined, isCommonJS: boolean] {
  let match = code.match(
    /\b(var|let|const) +(\w+) *= *require\(["']react["']\)/
  )
  if (match) {
    return [match[2], true]
  }
  match = code.match(/^import (\w+).+? from ["']react["']/m)
  if (match) {
    return [match[1], false]
  }
  return [undefined, false]
}
