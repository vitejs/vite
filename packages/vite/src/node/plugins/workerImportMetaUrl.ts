import path from 'node:path'
import MagicString from 'magic-string'
import type { RollupAstNode, RollupError } from 'rollup'
import { parseAstAsync } from 'rollup/parseAst'
import { stripLiteral } from 'strip-literal'
import type { Expression, ExpressionStatement } from 'estree'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import { evalValue, injectQuery, transformStableResult } from '../utils'
import { createBackCompatIdResolver } from '../idResolver'
import type { ResolveIdFn } from '../idResolver'
import { cleanUrl, slash } from '../../shared/utils'
import type { WorkerType } from './worker'
import { WORKER_FILE_ID, workerFileToUrl } from './worker'
import { fileToUrl } from './asset'
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

  for (let i = fromIndex + 1; i < input.length; i++) {
    if (input[i] === '(') count++
    if (input[i] === ')') count--
    if (count === 0) return i
  }

  return -1
}

function extractWorkerTypeFromAst(
  expression: Expression,
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
        .body[0] as RollupAstNode<ExpressionStatement>
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
  const workerOptString = raw
    .substring(commaIndex + 1, endIndex)
    .replace(/\}[\s\S]*,/g, '}') // strip trailing comma for parsing

  const hasViteIgnore = hasViteIgnoreRE.test(workerOptString)
  if (hasViteIgnore) {
    return 'ignore'
  }

  // need to find in no comment code
  const cleanWorkerOptString = clean.substring(commaIndex + 1, endIndex).trim()
  if (!cleanWorkerOptString.length) {
    return 'classic'
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

function isIncludeWorkerImportMetaUrl(code: string): boolean {
  if (
    (code.includes('new Worker') || code.includes('new SharedWorker')) &&
    code.includes('new URL') &&
    code.includes(`import.meta.url`)
  ) {
    return true
  }
  return false
}

export function workerImportMetaUrlPlugin(config: ResolvedConfig): Plugin {
  const isBuild = config.command === 'build'
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

    shouldTransformCachedModule({ code }) {
      if (isBuild && config.build.watch && isIncludeWorkerImportMetaUrl(code)) {
        return true
      }
    },

    async transform(code, id) {
      if (
        this.environment.config.consumer === 'client' &&
        isIncludeWorkerImportMetaUrl(code)
      ) {
        let s: MagicString | undefined
        const cleanString = stripLiteral(code)
        const workerImportMetaUrlRE =
          /\bnew\s+(?:Worker|SharedWorker)\s*\(\s*(new\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*\))/dg

        let match: RegExpExecArray | null
        while ((match = workerImportMetaUrlRE.exec(cleanString))) {
          const [[, endIndex], [expStart, expEnd], [urlStart, urlEnd]] =
            match.indices!

          const rawUrl = code.slice(urlStart, urlEnd)

          // potential dynamic template string
          if (rawUrl[0] === '`' && rawUrl.includes('${')) {
            this.error(
              `\`new URL(url, import.meta.url)\` is not supported in dynamic template string.`,
              expStart,
            )
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
            isBuild &&
            config.isWorker &&
            config.bundleChain.at(-1) === cleanUrl(file)
          ) {
            s.update(expStart, expEnd, 'self.location.href')
          } else {
            let builtUrl: string
            if (isBuild) {
              builtUrl = await workerFileToUrl(config, file)
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
              `new URL(/* @vite-ignore */ ${JSON.stringify(builtUrl)}, import.meta.url)`,
            )
          }
        }

        if (s) {
          return transformStableResult(s, id, config)
        }

        return null
      }
    },
  }
}
