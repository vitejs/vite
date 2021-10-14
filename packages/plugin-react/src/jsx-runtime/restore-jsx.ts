import type { PluginItem, types as t } from '@babel/core'

type RestoredJSX = [result: t.File | null | undefined, isCommonJS: boolean]

let babelRestoreJSX: Promise<PluginItem> | undefined

/** Restore JSX from `React.createElement` calls */
export async function restoreJSX(
  babel: typeof import('@babel/core'),
  code: string,
  filename: string
): Promise<RestoredJSX> {
  const [reactAlias, isCommonJS] = parseReactAlias(code)
  if (!reactAlias) {
    return [null, false]
  }

  const reactJsxRE = new RegExp(
    '\\b' + reactAlias + '\\.(createElement|Fragment)\\b',
    'g'
  )

  let hasCompiledJsx = false
  code = code.replace(reactJsxRE, (_, prop) => {
    hasCompiledJsx = true
    // Replace with "React" so JSX can be reverse compiled.
    return 'React.' + prop
  })

  if (!hasCompiledJsx) {
    return [null, false]
  }

  // Support modules that use `import {Fragment} from 'react'`
  code = code.replace(
    /createElement\(Fragment,/g,
    'createElement(React.Fragment,'
  )

  babelRestoreJSX ||= import('./babel-restore-jsx')

  const result = await babel.transformAsync(code, {
    ast: true,
    code: false,
    filename,
    parserOpts: {
      plugins: ['jsx']
    },
    plugins: [await babelRestoreJSX]
  })

  return [result?.ast, isCommonJS]
}

export function parseReactAlias(
  code: string
): [alias: string | undefined, isCommonJS: boolean] {
  let match = code.match(
    /\b(var|let|const)\s+([^=\{\s]+)\s*=\s*require\(["']react["']\)/
  )
  if (match) {
    return [match[2], true]
  }
  match = code.match(/^import\s+(?:\*\s+as\s+)?(\w+).+?\bfrom\s*["']react["']/m)
  if (match) {
    return [match[1], false]
  }
  return [undefined, false]
}
