import path from 'node:path'
import MagicString from 'magic-string'
import type { RollupError } from 'rolldown'
import { parseAstAsync } from 'rolldown/parseAst'
import { stripLiteral } from 'strip-literal'
import type { ESTree } from 'rolldown/utils'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import { evalValue, injectQuery, transformStableResult } from '../utils'
import { createBackCompatIdResolver } from '../idResolver'
import type { ResolveIdFn } from '../idResolver'
import { cleanUrl, slash } from '../../shared/utils'
import type { WorkerType } from './worker'
import { WORKER_FILE_ID, workerFileToUrl } from './worker'
import { fileToUrl, toOutputFilePathInJSForBundledDev } from './asset'
import type { InternalResolveOptions } from './resolve'
import { tryFsResolve } from './resolve'
import { hasViteIgnoreRE } from './importAnalysis'

interface WorkerOptions {
  type?: WorkerType
}

function err(e: string, pos: number) {
  const error = new Error(e) as RollupError
  error.pos = pos
  return error
}

function findClosingParen(input: string, fromIndex: number) {
  let count = 1

  for (let i = fromIndex; i < input.length; i++) {
    if (input[i] === '(') count++
    if (input[i] === ')') count--
    if (count === 0) return i
  }

  return -1
}

function extractWorkerTypeFromAst(
  expression: ESTree.Expression,
  optsStartIndex: number,
): 'classic' | 'module' | undefined {
  if (expression.type !== 'ObjectExpression') {
    return
  }

  let lastSpreadElementIndex = -1
  let typeProperty = null
  let typePropertyIndex = -1

  for (let i = 0; i < expression.properties.length; i++) {
    const property = expression.properties[i]

    if (property.type === 'SpreadElement') {
      lastSpreadElementIndex = i
      continue
    }

    if (
      property.type === 'Property' &&
      ((property.key.type === 'Identifier' && property.key.name === 'type') ||
        (property.key.type === 'Literal' && property.key.value === 'type'))
    ) {
      typeProperty = property
      typePropertyIndex = i
    }
  }

  if (typePropertyIndex === -1 && lastSpreadElementIndex === -1) {
    // No type property or spread element in use. Assume safe usage and default to classic
    return 'classic'
  }

  if (typePropertyIndex < lastSpreadElementIndex) {
    throw err(
      'Expected object spread to be used before the definition of the type property. ' +
        'Vite needs a static value for the type property to correctly infer it.',
      optsStartIndex,
    )
  }

  if (typeProperty?.value.type !== 'Literal') {
    throw err(
      'Expected worker options type property to be a literal value.',
      optsStartIndex,
    )
  }

  // Silently default to classic type like the getWorkerType method
  return typeProperty?.value.value === 'module' ? 'module' : 'classic'
}

async function parseWorkerOptions(
  rawOpts: string,
  optsStartIndex: number,
): Promise<WorkerOptions> {
  let opts: WorkerOptions = {}
  try {
    opts = evalValue<WorkerOptions>(rawOpts)
  } catch {
    const optsNode = (
      (await parseAstAsync(`(${rawOpts})`))
        .body[0] as ESTree.ExpressionStatement
    ).expression

    const type = extractWorkerTypeFromAst(optsNode, optsStartIndex)
    if (type) {
      return { type }
    }

    throw err(
      'Vite is unable to parse the worker options as the value is not static. ' +
        'To ignore this error, please use /* @vite-ignore */ in the worker options.',
      optsStartIndex,
    )
  }

  if (opts == null) {
    return {}
  }

  if (typeof opts !== 'object') {
    throw err(
      `Expected worker options to be an object, got ${typeof opts}`,
      optsStartIndex,
    )
  }

  return opts
}

async function getWorkerType(
  raw: string,
  clean: string,
  i: number,
): Promise<WorkerType> {
  const commaIndex = clean.indexOf(',', i)
  if (commaIndex === -1) {
    return 'classic'
  }
  const endIndex = findClosingParen(clean, i)

  // case: ') ... ,' mean no worker options params
  if (commaIndex > endIndex) {
    return 'classic'
  }

  // need to find in comment code
  let workerOptString = raw.substring(commaIndex + 1, endIndex)
  const hasViteIgnore = hasViteIgnoreRE.test(workerOptString)
  if (hasViteIgnore) {
    return 'ignore'
  }

  // need to find in no comment code
  const cleanWorkerOptString = clean.substring(commaIndex + 1, endIndex)
  const trimmedCleanWorkerOptString = cleanWorkerOptString.trim()
  if (!trimmedCleanWorkerOptString.length) {
    return 'classic'
  }

  // strip trailing comma for evalValue
  if (trimmedCleanWorkerOptString.endsWith(',')) {
    workerOptString = workerOptString.slice(
      0,
      cleanWorkerOptString.lastIndexOf(','),
    )
  }

  const workerOpts = await parseWorkerOptions(workerOptString, commaIndex + 1)
  if (
    workerOpts.type &&
    (workerOpts.type === 'module' || workerOpts.type === 'classic')
  ) {
    return workerOpts.type
  }

  return 'classic'
}

const workerImportMetaUrlRE =
  /new\s+(?:Worker|SharedWorker)\s*\(\s*new\s+URL.+?import\.meta\.url/s

/**
 * Checks if a template literal only contains safe expressions (import.meta.env.*)
 * and transforms it to string concatenation if safe.
 * Returns null if the template contains unsafe dynamic expressions.
 */
async function transformSafeTemplateLiteral(
  rawUrl: string,
): Promise<string | null> {
  // Not a template literal
  if (rawUrl[0] !== '`' || !rawUrl.includes('${')) {
    return null
  }

  try {
    // Parse the template literal as an expression
    const ast = await parseAstAsync(`(${rawUrl})`)
    const expression = (ast.body[0] as RollupAstNode<ExpressionStatement>)
      .expression

    if (expression.type !== 'TemplateLiteral') {
      return null
    }

    // Check if all expressions are safe (import.meta.env.*)
    for (const expr of expression.expressions) {
      if (!isSafeEnvExpression(expr)) {
        return null
      }
    }

    // Transform to string concatenation
    const parts: string[] = []
    for (let i = 0; i < expression.quasis.length; i++) {
      const quasi = expression.quasis[i]
      const quasiValue = quasi.value.raw

      if (quasiValue) {
        parts.push(JSON.stringify(quasiValue))
      }

      if (i < expression.expressions.length) {
        const expr = expression.expressions[i]
        parts.push(generateEnvAccessCode(expr))
      }
    }

    return parts.join(' + ')
  } catch {
    // If parsing fails, treat as unsafe
    return null
  }
}

/**
 * Checks if an expression is a safe import.meta.env.* access
 */
function isSafeEnvExpression(expr: any): boolean {
  if (expr.type !== 'MemberExpression') {
    return false
  }

  // Check if it's import.meta.env.*
  if (
    expr.object.type === 'MemberExpression' &&
    expr.object.object.type === 'MetaProperty' &&
    expr.object.object.meta.name === 'import' &&
    expr.object.object.property.name === 'meta' &&
    expr.object.property.type === 'Identifier' &&
    expr.object.property.name === 'env'
  ) {
    return true
  }

  return false
}

/**
 * Generates code for accessing import.meta.env property
 */
function generateEnvAccessCode(expr: any): string {
  if (expr.property.type === 'Identifier') {
    return `import.meta.env.${expr.property.name}`
  } else if (expr.property.type === 'Literal') {
    return `import.meta.env[${JSON.stringify(expr.property.value)}]`
  }
  return 'import.meta.env'
}

export function workerImportMetaUrlPlugin(config: ResolvedConfig): Plugin {
  const isBundled = config.isBundled
  let workerResolver: ResolveIdFn

  const fsResolveOptions: InternalResolveOptions = {
    ...config.resolve,
    root: config.root,
    isProduction: config.isProduction,
    isBuild: config.command === 'build',
    packageCache: config.packageCache,
    asSrc: true,
  }

  return {
    name: 'vite:worker-import-meta-url',

    applyToEnvironment(environment) {
      return environment.config.consumer === 'client'
    },

    transform: {
      filter: { code: workerImportMetaUrlRE },
      async handler(code, id) {
        let s: MagicString | undefined
        const cleanString = stripLiteral(code)

        // First, check if there are template literals with expressions to transform
        const templateLiteralRE =
          /\bnew\s+(?:Worker|SharedWorker)\s*\(\s*new\s+URL\s*\(\s*(`[^`]+`)\s*,\s*import\.meta\.url\s*\)/dg

        let templateMatch: RegExpExecArray | null
        let hasTransformedTemplates = false

        while ((templateMatch = templateLiteralRE.exec(cleanString))) {
          const [[,], [urlStart, urlEnd]] = templateMatch.indices!
          const rawUrl = code.slice(urlStart, urlEnd)

          if (rawUrl.includes('${')) {
            const transformed = await transformSafeTemplateLiteral(rawUrl)
            if (transformed) {
              s ||= new MagicString(code)
              s.update(urlStart, urlEnd, transformed)
              hasTransformedTemplates = true
            } else {
              // Unsafe dynamic template string
              this.error(
                `\`new URL(url, import.meta.url)\` is not supported in dynamic template string.\n` +
                  `Only template literals with \`import.meta.env.*\` expressions are supported.\n` +
                  `Use string concatenation instead: new URL('path/' + variable + '/file.ts', import.meta.url)`,
                urlStart,
              )
            }
          }
        }

        // If we transformed templates, return and let this run again
        if (hasTransformedTemplates && s) {
          return transformStableResult(s, id, config)
        }

        // Process worker URLs (regular strings and template literals without expressions)
        const workerImportMetaUrlRE =
          /\bnew\s+(?:Worker|SharedWorker)\s*\(\s*(new\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*(?:,\s*)?\))/dg

        let match: RegExpExecArray | null
        while ((match = workerImportMetaUrlRE.exec(cleanString))) {
          const [[, endIndex], [expStart, expEnd], [urlStart, urlEnd]] =
            match.indices!

          const rawUrl = code.slice(urlStart, urlEnd)

          // Skip template literals with expressions (should not happen at this point)
          if (rawUrl[0] === '`' && rawUrl.includes('${')) {
            continue
          }

          s ||= new MagicString(code)
          const workerType = await getWorkerType(code, cleanString, endIndex)
          const url = rawUrl.slice(1, -1)
          let file: string | undefined
          if (url[0] === '.') {
            file = path.resolve(path.dirname(id), url)
            file = slash(tryFsResolve(file, fsResolveOptions) ?? file)
          } else {
            workerResolver ??= createBackCompatIdResolver(config, {
              extensions: [],
              tryIndex: false,
              preferRelative: true,
            })
            file = await workerResolver(this.environment, url, id)
            file ??=
              url[0] === '/'
                ? slash(path.join(config.publicDir, url))
                : slash(path.resolve(path.dirname(id), url))
          }

          if (
            isBundled &&
            config.isWorker &&
            config.bundleChain.at(-1) === cleanUrl(file)
          ) {
            s.update(expStart, expEnd, 'self.location.href')
          } else {
            let builtUrl: string
            if (isBundled) {
              const result = await workerFileToUrl(config, file)
              if (
                this.environment.config.command === 'serve' &&
                this.environment.config.experimental.bundledDev
              ) {
                builtUrl = toOutputFilePathInJSForBundledDev(
                  this.environment,
                  result.entryFilename,
                )
              } else {
                builtUrl = result.entryUrlPlaceholder
              }
              for (const file of result.watchedFiles) {
                this.addWatchFile(file)
              }
            } else {
              builtUrl = await fileToUrl(this, cleanUrl(file))
              builtUrl = injectQuery(
                builtUrl,
                `${WORKER_FILE_ID}&type=${workerType}`,
              )
            }
            s.update(
              expStart,
              expEnd,
              // NOTE: add `'' +` to opt-out rolldown's transform: https://github.com/rolldown/rolldown/issues/2745
              `new URL(/* @vite-ignore */ ${JSON.stringify(builtUrl)}, '' + import.meta.url)`,
            )
          }
        }

        if (s) {
          return transformStableResult(s, id, config)
        }

        return null
      },
    },
  }
}
