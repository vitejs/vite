import { isAbsolute, posix } from 'path'
import micromatch from 'micromatch'
import { stripLiteral } from 'strip-literal'
import type {
  ArrayExpression,
  CallExpression,
  Literal,
  Node,
  SequenceExpression
} from 'estree'
import { parseExpressionAt } from 'acorn'
import MagicString from 'magic-string'
import fg from 'fast-glob'
import { stringifyQuery } from 'ufo'
import type { GeneralImportGlobOptions } from 'types/importGlob'
import type { Plugin } from '../plugin'
import type { ViteDevServer } from '../server'
import type { ModuleNode } from '../server/moduleGraph'
import type { ResolvedConfig } from '../config'
import { normalizePath, slash, transformResult } from '../utils'

const { isMatch, scan } = micromatch

export interface ParsedImportGlob {
  match: RegExpMatchArray
  index: number
  globs: string[]
  globsResolved: string[]
  isRelative: boolean
  options: GeneralImportGlobOptions
  type: string
  start: number
  end: number
}

export function getAffectedGlobModules(
  file: string,
  server: ViteDevServer
): ModuleNode[] {
  const modules: ModuleNode[] = []
  for (const [id, allGlobs] of server._importGlobMap!) {
    if (allGlobs.some((glob) => isMatch(file, glob)))
      modules.push(...(server.moduleGraph.getModulesByFile(id) || []))
  }
  modules.forEach((i) => {
    if (i?.file) server.moduleGraph.onFileChange(i.file)
  })
  return modules
}

export function importGlobPlugin(config: ResolvedConfig): Plugin {
  let server: ViteDevServer | undefined

  return {
    name: 'vite:import-glob',
    configureServer(_server) {
      server = _server
      server._importGlobMap.clear()
    },
    async transform(code, id) {
      if (!code.includes('import.meta.glob')) return
      const result = await transformGlobImport(
        code,
        id,
        config.root,
        (im) => this.resolve(im, id).then((i) => i?.id || im),
        config.experimental?.importGlobRestoreExtension
      )
      if (result) {
        if (server) {
          const allGlobs = result.matches.map((i) => i.globsResolved)
          server._importGlobMap.set(id, allGlobs)
          result.files.forEach((file) => {
            // update watcher
            server!.watcher.add(dirname(file))
          })
        }
        return transformResult(result.s, id, config)
      }
    }
  }
}

const importGlobRE =
  /\bimport\.meta\.(glob|globEager|globEagerDefault)(?:<\w+>)?\s*\(/g

const knownOptions = {
  as: 'string',
  eager: 'boolean',
  import: 'string',
  exhaustive: 'boolean'
} as const

const forceDefaultAs = ['raw', 'url']

export async function parseImportGlob(
  code: string,
  importer: string | undefined,
  root: string,
  resolveId: IdResolver
): Promise<ParsedImportGlob[]> {
  let cleanCode
  try {
    cleanCode = stripLiteral(code)
  } catch (e) {
    // skip invalid js code
    return []
  }
  const matches = Array.from(cleanCode.matchAll(importGlobRE))

  const tasks = matches.map(async (match, index) => {
    const type = match[1]
    const start = match.index!

    const err = (msg: string) => {
      const e = new Error(`Invalid glob import syntax: ${msg}`)
      ;(e as any).pos = start
      return e
    }

    let ast: CallExpression | SequenceExpression
    let lastTokenPos: number | undefined

    try {
      ast = parseExpressionAt(code, start, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ranges: true,
        onToken: (token) => {
          lastTokenPos = token.end
        }
      }) as any
    } catch (e) {
      const _e = e as any
      if (_e.message && _e.message.startsWith('Unterminated string constant'))
        return undefined!
      if (lastTokenPos == null || lastTokenPos <= start) throw _e

      // tailing comma in object or array will make the parser think it's a comma operation
      // we try to parse again removing the comma
      try {
        const statement = code.slice(start, lastTokenPos).replace(/[,\s]*$/, '')
        ast = parseExpressionAt(
          ' '.repeat(start) + statement, // to keep the ast position
          start,
          {
            ecmaVersion: 'latest',
            sourceType: 'module',
            ranges: true
          }
        ) as any
      } catch {
        throw _e
      }
    }

    if (ast.type === 'SequenceExpression')
      ast = ast.expressions[0] as CallExpression

    if (ast.type !== 'CallExpression')
      throw err(`Expect CallExpression, got ${ast.type}`)

    if (ast.arguments.length < 1 || ast.arguments.length > 2)
      throw err(`Expected 1-2 arguments, but got ${ast.arguments.length}`)

    const arg1 = ast.arguments[0] as ArrayExpression | Literal
    const arg2 = ast.arguments[1] as Node | undefined

    const globs: string[] = []
    if (arg1.type === 'ArrayExpression') {
      for (const element of arg1.elements) {
        if (!element) continue
        if (element.type !== 'Literal') throw err('Could only use literals')
        if (typeof element.value !== 'string')
          throw err(
            `Expected glob to be a string, but got "${typeof element.value}"`
          )

        globs.push(element.value)
      }
    } else if (arg1.type === 'Literal') {
      if (typeof arg1.value !== 'string')
        throw err(
          `Expected glob to be a string, but got "${typeof arg1.value}"`
        )
      globs.push(arg1.value)
    } else {
      throw err('Could only use literals')
    }

    // arg2
    const options: GeneralImportGlobOptions = {}
    if (arg2) {
      if (arg2.type !== 'ObjectExpression')
        throw err(
          `Expected the second argument o to be a object literal, but got "${arg2.type}"`
        )

      for (const property of arg2.properties) {
        if (
          property.type === 'SpreadElement' ||
          (property.key.type !== 'Identifier' &&
            property.key.type !== 'Literal')
        )
          throw err('Could only use literals')

        const name = ((property.key as any).name ||
          (property.key as any).value) as keyof GeneralImportGlobOptions
        if (name === 'query') {
          if (property.value.type === 'ObjectExpression') {
            const data: Record<string, string> = {}
            for (const prop of property.value.properties) {
              if (
                prop.type === 'SpreadElement' ||
                prop.key.type !== 'Identifier' ||
                prop.value.type !== 'Literal'
              )
                throw err('Could only use literals')
              data[prop.key.name] = prop.value.value as any
            }
            options.query = data
          } else if (property.value.type === 'Literal') {
            if (typeof property.value.value !== 'string')
              throw err(
                `Expected query to be a string, but got "${typeof property.value
                  .value}"`
              )
            options.query = property.value.value
          } else {
            throw err('Could only use literals')
          }
          continue
        }

        if (!(name in knownOptions)) throw err(`Unknown options ${name}`)

        if (property.value.type !== 'Literal')
          throw err('Could only use literals')

        const valueType = typeof property.value.value
        if (valueType === 'undefined') continue

        if (valueType !== knownOptions[name])
          throw err(
            `Expected the type of option "${name}" to be "${knownOptions[name]}", but got "${valueType}"`
          )
        options[name] = property.value.value as any
      }
    }

    if (options.as && forceDefaultAs.includes(options.as)) {
      if (
        options.import &&
        options.import !== 'default' &&
        options.import !== '*'
      )
        throw err(
          `Option "import" can only be "default" or "*" when "as" is "${options.as}", but got "${options.import}"`
        )
      options.import = options.import || 'default'
    }

    if (options.as && options.query)
      throw err('Options "as" and "query" cannot be used together')

    if (options.as) options.query = options.as

    const end = ast.range![1]

    const globsResolved = await Promise.all(
      globs.map((glob) => toAbsoluteGlob(glob, root, importer, resolveId))
    )
    const isRelative = globs.every((i) => '.!'.includes(i[0]))

    return {
      match,
      index,
      globs,
      globsResolved,
      isRelative,
      options,
      type,
      start,
      end
    }
  })

  return (await Promise.all(tasks)).filter(Boolean)
}

const importPrefix = '__vite_glob_'

const { basename, dirname, relative, join } = posix

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
  restoreQueryExtension = false
): Promise<TransformGlobImportResult | null> {
  id = slash(id)
  root = slash(root)
  const isVirtual = isVirtualModule(id)
  const dir = isVirtual ? undefined : dirname(id)
  const matches = await parseImportGlob(
    code,
    isVirtual ? undefined : id,
    root,
    resolveId
  )
  const matchedFiles = new Set<string>()

  // TODO: backwards compatibility
  matches.forEach((i) => {
    if (i.type === 'globEager') i.options.eager = true
    if (i.type === 'globEagerDefault') {
      i.options.eager = true
      i.options.import = 'default'
    }
  })

  if (!matches.length) return null

  const s = new MagicString(code)

  const staticImports = (
    await Promise.all(
      matches.map(
        async ({ globsResolved, isRelative, options, index, start, end }) => {
          const cwd = getCommonBase(globsResolved) ?? root
          const files = (
            await fg(globsResolved, {
              cwd,
              absolute: true,
              dot: !!options.exhaustive,
              ignore: options.exhaustive
                ? []
                : [join(cwd, '**/node_modules/**')]
            })
          )
            .filter((file) => file !== id)
            .sort()

          const objectProps: string[] = []
          const staticImports: string[] = []

          let query = !options.query
            ? ''
            : typeof options.query === 'string'
            ? options.query
            : stringifyQuery(options.query as any)

          if (query && !query.startsWith('?')) query = `?${query}`

          const resolvePaths = (file: string) => {
            if (!dir) {
              if (isRelative)
                throw new Error(
                  "In virtual modules, all globs must start with '/'"
                )
              const filePath = `/${relative(root, file)}`
              return { filePath, importPath: filePath }
            }

            let importPath = relative(dir, file)
            if (!importPath.startsWith('.')) importPath = `./${importPath}`

            let filePath: string
            if (isRelative) {
              filePath = importPath
            } else {
              filePath = relative(root, file)
              if (!filePath.startsWith('.')) filePath = `/${filePath}`
            }

            return { filePath, importPath }
          }

          files.forEach((file, i) => {
            const paths = resolvePaths(file)
            const filePath = paths.filePath
            let importPath = paths.importPath
            let importQuery = query

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
                `import ${expression} from ${JSON.stringify(importPath)}`
              )
              objectProps.push(`${JSON.stringify(filePath)}: ${variableName}`)
            } else {
              let importStatement = `import(${JSON.stringify(importPath)})`
              if (importKey)
                importStatement += `.then(m => m[${JSON.stringify(importKey)}])`
              objectProps.push(
                `${JSON.stringify(filePath)}: () => ${importStatement}`
              )
            }
          })

          files.forEach((i) => matchedFiles.add(i))

          const replacement = `Object.assign({\n${objectProps.join(',\n')}\n})`
          s.overwrite(start, end, replacement)

          return staticImports
        }
      )
    )
  ).flat()

  if (staticImports.length) s.prepend(`${staticImports.join('\n')}\n`)

  return {
    s,
    matches,
    files: matchedFiles
  }
}

type IdResolver = (
  id: string,
  importer?: string
) => Promise<string | undefined> | string | undefined

export async function toAbsoluteGlob(
  glob: string,
  root: string,
  importer: string | undefined,
  resolveId: IdResolver
): Promise<string> {
  let pre = ''
  if (glob.startsWith('!')) {
    pre = '!'
    glob = glob.slice(1)
  }

  const dir = importer ? dirname(importer) : root
  if (glob.startsWith('/')) return pre + posix.join(root, glob.slice(1))
  if (glob.startsWith('./')) return pre + posix.join(dir, glob.slice(2))
  if (glob.startsWith('../')) return pre + posix.join(dir, glob)
  if (glob.startsWith('**')) return pre + glob

  const resolved = normalizePath((await resolveId(glob, importer)) || glob)
  if (isAbsolute(resolved)) return pre + resolved

  throw new Error(
    `Invalid glob: "${glob}" (resolved: "${resolved}"). It must starts with '/' or './'`
  )
}

export function getCommonBase(globsResolved: string[]): null | string {
  const bases = globsResolved
    .filter((g) => !g.startsWith('!'))
    .map((glob) => {
      let { base } = scan(glob)
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
  // https://vitejs.dev/guide/api-plugin.html#virtual-modules-convention
  return id.startsWith('virtual:') || id.startsWith('\0') || !id.includes('/')
}
