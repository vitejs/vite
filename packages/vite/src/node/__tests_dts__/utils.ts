/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Equal, ExpectTrue } from '@type-challenges/utils'
import { mergeWithDefaults } from '../utils'

const useDefaultTypeForUndefined1 = mergeWithDefaults(
  {
    foo: 1,
  },
  {},
)

const useDefaultTypeForUndefined2 = mergeWithDefaults(
  {
    foo: 1,
  },
  {
    foo: 2 as number | undefined,
  },
)

const includeKeyNotIncludedInDefault1 = mergeWithDefaults(
  {},
  {
    foo: 2,
  },
)

const extendTypeWithValueType = mergeWithDefaults(
  {
    foo: 1,
  },
  {
    foo: 'string' as string | number,
  },
)

const plainObject = mergeWithDefaults({ foo: { bar: 1 } }, { foo: { baz: 2 } })

const nonPlainObject = mergeWithDefaults(
  { foo: ['foo'] },
  { foo: [0] as number[] | undefined },
)

const optionalNested = mergeWithDefaults({ foo: { bar: true } }, {
  foo: { bar: false },
} as { foo?: { bar?: boolean } })

export type cases1 = [
  ExpectTrue<Equal<typeof useDefaultTypeForUndefined1, { foo: number }>>,
  ExpectTrue<Equal<typeof useDefaultTypeForUndefined2, { foo: number }>>,
  ExpectTrue<Equal<typeof includeKeyNotIncludedInDefault1, { foo: number }>>,
  ExpectTrue<Equal<typeof extendTypeWithValueType, { foo: string | number }>>,
  ExpectTrue<Equal<typeof plainObject, { foo: { bar: number; baz: number } }>>,
  ExpectTrue<Equal<typeof nonPlainObject, { foo: string[] | number[] }>>,
  ExpectTrue<
    Equal<typeof optionalNested, { foo: { bar: boolean } | { bar: boolean } }>
  >,
]
