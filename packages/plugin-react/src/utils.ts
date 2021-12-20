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

type FileFilter = (id: string) => boolean

export function createFileFilter(
  arg: boolean | FilterOptions,
  resolve?: string
): FileFilter {
  return arg === false
    ? returnFalse
    : arg === true || (!arg.include && !arg.exclude)
    ? returnTrue
    : createFilter(arg.include, arg.exclude, { resolve })
}
