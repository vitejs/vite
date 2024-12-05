import type { StrictRegExpExecArray } from './typeUtils'

declare global {
  interface String {
    split(
      splitter: { [Symbol.split](string: string, limit?: number): string[] },
      limit?: number,
    ): [string, ...string[]]
    split(separator: string, limit?: number): [string, ...string[]]

    matchAll<ValuesOrLen extends readonly boolean[] | number | null = null>(
      regexp: RegExp,
    ): RegExpStringIterator<StrictRegExpExecArray<ValuesOrLen>>
  }

  interface RegExp {
    exec<ValuesOrLen extends readonly boolean[] | number | null = null>(
      string: string,
    ): StrictRegExpExecArray<ValuesOrLen> | null
  }
}
