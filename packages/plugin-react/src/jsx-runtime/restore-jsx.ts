import type * as babelCore from '@babel/core'

type RestoredJSX = [
  result: babelCore.types.File | null | undefined,
  isCommonJS: boolean
]

let babelRestoreJSX: Promise<babelCore.PluginItem> | undefined

const jsxNotFound: RestoredJSX = [null, false]

async function getBabelRestoreJSX() {
  if (!babelRestoreJSX)
    babelRestoreJSX = import('./babel-restore-jsx').then((r) => {
      const fn = r.default
      if ('default' in fn)
        // @ts-expect-error
        return fn.default
      return fn
    })
  return babelRestoreJSX
}

/** Restore JSX from `React.createElement` calls */
export async function restoreJSX(
  babel: typeof babelCore,
  code: string,
  filename: string
): Promise<RestoredJSX> {
  const [reactAlias, isCommonJS] = parseReactAlias(code)

  if (!reactAlias) {
    return jsxNotFound
  }

  const reactJsxRE = new RegExp(
    `\\b${reactAlias}\\.(createElement|Fragment)\\b`,
    'g'
  )

  if (!reactJsxRE.test(code)) {
    return jsxNotFound
  }

  const result = await babel.transformAsync(code, {
    babelrc: false,
    configFile: false,
    ast: true,
    code: false,
    filename,
    parserOpts: {
      plugins: ['jsx']
    },
    plugins: [[await getBabelRestoreJSX(), { reactAlias }]]
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
