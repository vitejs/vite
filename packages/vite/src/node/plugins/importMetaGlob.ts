import { isAbsolute, posix } from 'node:path'
import picomatch from 'picomatch'
import { stripLiteral } from 'strip-literal'
import colors from 'picocolors'
import type {
  ArrayExpression,
  Expression,
  Literal,
  Node,
  SpreadElement,
  TemplateLiteral,
} from 'estree'
import type { CustomPluginOptions, RollupAstNode, RollupError } from 'rollup'
import MagicString from 'magic-string'
import { stringifyQuery } from 'ufo'
import type { GeneralImportGlobOptions } from 'types/importGlob'
import { parseAstAsync } from 'rollup/parseAst'
import { escapePath, glob } from 'tinyglobby'
import type { Plugin } from '../plugin'
import type { EnvironmentModuleNode } from '../server/moduleGraph'
import type { ResolvedConfig } from '../config'
import { evalValue, normalizePath, transformStableResult } from '../utils'
import type { Logger } from '../logger'
import { slash } from '../../shared/utils'
import type { Environment } from '../environment'

export interface ParsedImportGlob {
  index: number
  globs: string[]
  globsResolved: string[]
  isRelative: boolean
  options: ParsedGeneralImportGlobOptions
  start: number
  end: number
}

interface ParsedGeneralImportGlobOptions extends GeneralImportGlobOptions {
  query?: string
}

export function importGlobPlugin(config: ResolvedConfig): Plugin {
  const importGlobMaps = new Map<
    Environment,
    Map<string, Array<(file: string) => boolean>>
  >()

  return {
    name: 'vite:import-glob',
    buildStart() {
      importGlobMaps.clear()
    },
    async transform(code, id) {
      if (!code.includes('import.meta.glob')) return
      const result = await transformGlobImport(
        code,
        id,
        config.root,
        (im, _, options) =>
          this.resolve(im, id, options).then((i) => i?.id || im),
        config.experimental.importGlobRestoreExtension,
        config.logger,
      )
      if (result) {
        const allGlobs = result.matches.map((i) => i.globsResolved)
        if (!importGlobMaps.has(this.environment)) {
          importGlobMaps.set(this.environment, new Map())
        }

        const globMatchers = allGlobs.map((globs) => {
          const affirmed: string[] = []
          const negated: string[] = []
          for (const glob of globs) {
            ;(glob[0] === '!' ? negated : affirmed).push(glob)
          }
          const affirmedMatcher = picomatch(affirmed)
          const negatedMatcher = picomatch(negated)

          return (file: string) => {
            // (glob1 || glob2) && !(glob3 || glob4)...
            return (
              (affirmed.length === 0 || affirmedMatcher(file)) &&
              !(negated.length > 0 && negatedMatcher(file))
            )
          }
        })
        importGlobMaps.get(this.environment)!.set(id, globMatchers)

        return transformStableResult(result.s, id, config)
      }
    },
    hotUpdate({ type, file, modules: oldModules }) {
      if (type === 'update') return

      const importGlobMap = importGlobMaps.get(this.environment)
      if (!importGlobMap) return

      const modules: EnvironmentModuleNode[] = []
      for (const [id, globMatchers] of importGlobMap) {
        if (globMatchers.some((matcher) => matcher(file))) {
          const mod = this.environment.moduleGraph.getModuleById(id)
          if (mod) modules.push(mod)
        }
      }
      return modules.length > 0 ? [...oldModules, ...modules] : undefined
    },
  }
}

const importGlobRE = /\bimport\.meta\.glob(?:<\w+>)?\s*\(/g

const knownOptions = {
  as: ['string'],
  eager: ['boolean'],
  import: ['string'],
  exhaustive: ['boolean'],
  query: ['object', 'string'],
}

const forceDefaultAs = ['raw', 'url']

function err(e: string, pos: number) {
  const error = new Error(e) as RollupError
  error.pos = pos
  return error
}

function parseGlobOptions(
  rawOpts: string,
  optsStartIndex: number,
  logger?: Logger,
): ParsedGeneralImportGlobOptions {
  let opts: GeneralImportGlobOptions = {}
  try {
    opts = evalValue(rawOpts)
  } catch {
    throw err(
      'Vite is unable to parse the glob options as the value is not static',
      optsStartIndex,
    )
  }

  if (opts == null) {
    return {}
  }

  for (const key in opts) {
    if (!(key in knownOptions)) {
      throw err(`Unknown glob option "${key}"`, optsStartIndex)
    }
    const allowedTypes = knownOptions[key as keyof typeof knownOptions]
    const valueType = typeof opts[key as keyof GeneralImportGlobOptions]
    if (!allowedTypes.includes(valueType)) {
      throw err(
        `Expected glob option "${key}" to be of type ${allowedTypes.join(
          ' or ',
        )}, but got ${valueType}`,
        optsStartIndex,
      )
    }
  }

  if (typeof opts.query === 'object') {
    for (const key in opts.query) {
      const value = opts.query[key]
      if (!['string', 'number', 'boolean'].includes(typeof value)) {
        throw err(
          `Expected glob option "query.${key}" to be of type string, number, or boolean, but got ${typeof value}`,
          optsStartIndex,
        )
      }
    }
    // normalize query as string so it's easier to handle later
    opts.query = stringifyQuery(opts.query)
  }

  if (opts.as && logger) {
    const importSuggestion = forceDefaultAs.includes(opts.as)
      ? `, import: 'default'`
      : ''
    logger.warn(
      colors.yellow(
        `The glob option "as" has been deprecated in favour of "query". Please update \`as: '${opts.as}'\` to \`query: '?${opts.as}'${importSuggestion}\`.`,
      ),
    )
  }

  // validate `import` option based on `as` option
  if (opts.as && forceDefaultAs.includes(opts.as)) {
    if (opts.import && opts.import !== 'default' && opts.import !== '*')
      throw err(
        `Option "import" can only be "default" or "*" when "as" is "${opts.as}", but got "${opts.import}"`,
        optsStartIndex,
      )
    opts.import = opts.import || 'default'
  }

  if (opts.as && opts.query)
    throw err(
      'Options "as" and "query" cannot be used together',
      optsStartIndex,
    )

  if (opts.as) opts.query = opts.as

  if (opts.query && opts.query[0] !== '?') opts.query = `?${opts.query}`

  return opts as ParsedGeneralImportGlobOptions
}

export async function parseImportGlob(
  code: string,
  importer: string | undefined,
  root: string,
  resolveId: IdResolver,
  logger?: Logger,
): Promise<ParsedImportGlob[]> {
  let cleanCode: string
  try {
    cleanCode = stripLiteral(code)
  } catch {
    // skip invalid js code
    return []
  }
  const matches = Array.from(cleanCode.matchAll(importGlobRE))

  const tasks = matches.map(async (match, index) => {
    const start = match.index!

    const err = (msg: string) => {
      const e = new Error(`Invalid glob import syntax: ${msg}`)
      ;(e as any).pos = start
      return e
    }

    const end =
      findCorrespondingCloseParenthesisPosition(
        cleanCode,
        start + match[0].length,
      ) + 1
    if (end <= 0) {
      throw err('Close parenthesis not found')
    }

    const statementCode = code.slice(start, end)

    const rootAst = (await parseAstAsync(statementCode)).body[0]
    if (rootAst.type !== 'ExpressionStatement') {
      throw err(`Expect CallExpression, got ${rootAst.type}`)
    }
    const ast = rootAst.expression
    if (ast.type !== 'CallExpression') {
      throw err(`Expect CallExpression, got ${ast.type}`)
    }
    if (ast.arguments.length < 1 || ast.arguments.length > 2)
      throw err(`Expected 1-2 arguments, but got ${ast.arguments.length}`)

    const arg1 = ast.arguments[0] as ArrayExpression | Literal | TemplateLiteral
    const arg2 = ast.arguments[1] as RollupAstNode<Node> | undefined

    const globs: string[] = []

    const validateLiteral = (element: Expression | SpreadElement | null) => {
      if (!element) return
      if (element.type === 'Literal') {
        if (typeof element.value !== 'string')
          throw err(
            `Expected glob to be a string, but got "${typeof element.value}"`,
          )
        globs.push(element.value)
      } else if (element.type === 'TemplateLiteral') {
        if (element.expressions.length !== 0) {
          throw err(
            `Expected glob to be a string, but got dynamic template literal`,
          )
        }
        globs.push(element.quasis[0].value.raw)
      } else {
        throw err('Could only use literals')
      }
    }

    if (arg1.type === 'ArrayExpression') {
      for (const element of arg1.elements) {
        validateLiteral(element)
      }
    } else {
      validateLiteral(arg1)
    }

    // arg2
    let options: ParsedGeneralImportGlobOptions = {}
    if (arg2) {
      if (arg2.type !== 'ObjectExpression')
        throw err(
          `Expected the second argument to be an object literal, but got "${arg2.type}"`,
        )

      options = parseGlobOptions(
        code.slice(start + arg2.start, start + arg2.end),
        start + arg2.start,
        logger,
      )
    }

    const globsResolved = await Promise.all(
      globs.map((glob) => toAbsoluteGlob(glob, root, importer, resolveId)),
    )
    const isRelative = globs.every((i) => '.!'.includes(i[0]))

    return {
      index,
      globs,
      globsResolved,
      isRelative,
      options,
      start,
      end,
    }
  })

  return (await Promise.all(tasks)).filter(Boolean)
}

function findCorrespondingCloseParenthesisPosition(
  cleanCode: string,
  openPos: number,
) {
  const closePos = cleanCode.indexOf(')', openPos)
  if (closePos < 0) return -1

  if (!cleanCode.slice(openPos, closePos).includes('(')) return closePos

  let remainingParenthesisCount = 0
  const cleanCodeLen = cleanCode.length
  for (let pos = openPos; pos < cleanCodeLen; pos++) {
    switch (cleanCode[pos]) {
      case '(': {
        remainingParenthesisCount++
        break
      }
      case ')': {
        remainingParenthesisCount--
        if (remainingParenthesisCount <= 0) {
          return pos
        }
      }
    }
  }
  return -1
}

const importPrefix = '__vite_glob_'

const { basename, dirname, relative } = posix

export interface TransformGlobImportResult {
  s: MagicString
  matches: ParsedImportGlob[]
  files: Set<string>
}

/**
 * @param optimizeExport for dynamicImportVar plugin don't need to optimize export.
 */
export async function transformGlobImport(
  code: string,
  id: string,
  root: string,
  resolveId: IdResolver,
  restoreQueryExtension = false,
  logger?: Logger,
): Promise<TransformGlobImportResult | null> {
  id = slash(id)
  root = slash(root)
  const isVirtual = isVirtualModule(id)
  const dir = isVirtual ? undefined : dirname(id)
  const matches = await parseImportGlob(
    code,
    isVirtual ? undefined : id,
    root,
    resolveId,
    logger,
  )
  const matchedFiles = new Set<string>()

  if (!matches.length) return null

  const s = new MagicString(code)

  const staticImports = (
    await Promise.all(
      matches.map(
        async ({ globsResolved, isRelative, options, index, start, end }) => {
          const cwd = getCommonBase(globsResolved) ?? root
          const files = (
            await glob(globsResolved, {
              absolute: true,
              cwd,
              dot: !!options.exhaustive,
              expandDirectories: false,
              ignore: options.exhaustive ? [] : ['**/node_modules/**'],
            })
          )
            .filter((file) => file !== id)
            .sort()

          const objectProps: string[] = []
          const staticImports: string[] = []

          const resolvePaths = (file: string) => {
            if (!dir) {
              if (isRelative)
                throw new Error(
                  "In virtual modules, all globs must start with '/'",
                )
              const filePath = `/${relative(root, file)}`
              return { filePath, importPath: filePath }
            }

            let importPath = relative(dir, file)
            if (importPath[0] !== '.') importPath = `./${importPath}`

            let filePath: string
            if (isRelative) {
              filePath = importPath
            } else {
              filePath = relative(root, file)
              if (filePath[0] !== '.') filePath = `/${filePath}`
            }

            return { filePath, importPath }
          }

          files.forEach((file, i) => {
            const paths = resolvePaths(file)
            const filePath = paths.filePath
            let importPath = paths.importPath
            let importQuery = options.query ?? ''

            if (importQuery && importQuery !== '?raw') {
              const fileExtension = basename(file).split('.').slice(-1)[0]
              if (fileExtension && restoreQueryExtension)
                importQuery = `${importQuery}&lang.${fileExtension}`
            }

            importPath = `${importPath}${importQuery}`

            const importKey =
              options.import && options.import !== '*'
                ? options.import
                : undefined

            if (options.eager) {
              const variableName = `${importPrefix}${index}_${i}`
              const expression = importKey
                ? `{ ${importKey} as ${variableName} }`
                : `* as ${variableName}`
              staticImports.push(
                `import ${expression} from ${JSON.stringify(importPath)}`,
              )
              objectProps.push(`${JSON.stringify(filePath)}: ${variableName}`)
            } else {
              let importStatement = `import(${JSON.stringify(importPath)})`
              if (importKey)
                importStatement += `.then(m => m[${JSON.stringify(importKey)}])`
              objectProps.push(
                `${JSON.stringify(filePath)}: () => ${importStatement}`,
              )
            }
          })

          files.forEach((i) => matchedFiles.add(i))

          const originalLineBreakCount =
            code.slice(start, end).match(/\n/g)?.length ?? 0
          const lineBreaks =
            originalLineBreakCount > 0
              ? '\n'.repeat(originalLineBreakCount)
              : ''

          const replacement = `/* #__PURE__ */ Object.assign({${objectProps.join(
            ',',
          )}${lineBreaks}})`
          s.overwrite(start, end, replacement)

          return staticImports
        },
      ),
    )
  ).flat()

  if (staticImports.length) s.prepend(`${staticImports.join(';')};`)

  return {
    s,
    matches,
    files: matchedFiles,
  }
}

type IdResolver = (
  id: string,
  importer?: string,
  options?: {
    attributes?: Record<string, string>
    custom?: CustomPluginOptions
    isEntry?: boolean
    skipSelf?: boolean
  },
) => Promise<string | undefined> | string | undefined

function globSafePath(path: string) {
  // slash path to ensure \ is converted to / as \ could lead to a double escape scenario
  return escapePath(normalizePath(path))
}

function lastNthChar(str: string, n: number) {
  return str.charAt(str.length - 1 - n)
}

function globSafeResolvedPath(resolved: string, glob: string) {
  // we have to escape special glob characters in the resolved path, but keep the user specified globby suffix
  // walk back both strings until a character difference is found
  // then slice up the resolved path at that pos and escape the first part
  let numEqual = 0
  const maxEqual = Math.min(resolved.length, glob.length)
  while (
    numEqual < maxEqual &&
    lastNthChar(resolved, numEqual) === lastNthChar(glob, numEqual)
  ) {
    numEqual += 1
  }
  const staticPartEnd = resolved.length - numEqual
  const staticPart = resolved.slice(0, staticPartEnd)
  const dynamicPart = resolved.slice(staticPartEnd)
  return globSafePath(staticPart) + dynamicPart
}

export async function toAbsoluteGlob(
  glob: string,
  root: string,
  importer: string | undefined,
  resolveId: IdResolver,
): Promise<string> {
  let pre = ''
  if (glob[0] === '!') {
    pre = '!'
    glob = glob.slice(1)
  }
  root = globSafePath(root)
  const dir = importer ? globSafePath(dirname(importer)) : root
  if (glob[0] === '/') return pre + posix.join(root, glob.slice(1))
  if (glob.startsWith('./')) return pre + posix.join(dir, glob.slice(2))
  if (glob.startsWith('../')) return pre + posix.join(dir, glob)
  if (glob.startsWith('**')) return pre + glob

  const isSubImportsPattern = glob[0] === '#' && glob.includes('*')

  const resolved = normalizePath(
    (await resolveId(glob, importer, {
      custom: { 'vite:import-glob': { isSubImportsPattern } },
    })) || glob,
  )
  if (isAbsolute(resolved)) {
    return pre + globSafeResolvedPath(resolved, glob)
  }

  throw new Error(
    `Invalid glob: "${glob}" (resolved: "${resolved}"). It must start with '/' or './'`,
  )
}

export function getCommonBase(globsResolved: string[]): null | string {
  const bases = globsResolved
    .filter((g) => g[0] !== '!')
    .map((glob) => {
      let { base } = picomatch.scan(glob)
      // `scan('a/foo.js')` returns `base: 'a/foo.js'`
      if (posix.basename(base).includes('.')) base = posix.dirname(base)

      return base
    })

  if (!bases.length) return null

  let commonAncestor = ''
  const dirS = bases[0].split('/')
  for (let i = 0; i < dirS.length; i++) {
    const candidate = dirS.slice(0, i + 1).join('/')
    if (bases.every((base) => base.startsWith(candidate)))
      commonAncestor = candidate
    else break
  }
  if (!commonAncestor) commonAncestor = '/'

  return commonAncestor
}

export function isVirtualModule(id: string): boolean {
  // https://vite.dev/guide/api-plugin.html#virtual-modules-convention
  return id.startsWith('virtual:') || id[0] === '\0' || !id.includes('/')
}
