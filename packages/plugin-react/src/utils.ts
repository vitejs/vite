import { createFilter } from '@rollup/pluginutils'

export function loadPlugin(path: string): Promise<any> {
  return import(path).then((module) => module.default || module)
}

export interface FilterOptions {
  include?: string | RegExp | Array<string | RegExp>
  exclude?: string | RegExp | Array<string | RegExp>
}

const returnTrue = () => true
const returnFalse = () => false

export type FileFilter = (id: string) => boolean

export function createFileFilter(
  arg: boolean | FilterOptions | undefined,
  defaultArg: boolean,
  resolve?: string
): FileFilter {
  return arg === true
    ? returnTrue
    : arg === false
    ? returnFalse
    : arg && (arg.include || arg.exclude)
    ? createFilter(arg.include, arg.exclude, { resolve })
    : defaultArg
    ? returnTrue
    : returnFalse
}
