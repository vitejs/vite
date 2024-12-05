import type { Equal, ExpectTrue } from '@type-challenges/utils'
import type {
  BooleansToValues,
  RegExpIndexValue,
  StrictRegExpExecArray,
  StrictRegExpIndicesArrayFromValues,
} from '../strict'

export type booleansToValuesCases = [
  ExpectTrue<Equal<BooleansToValues<[true], string>, [string]>>,
  ExpectTrue<Equal<BooleansToValues<[false], string>, [undefined]>>,
  ExpectTrue<Equal<BooleansToValues<[boolean], string>, [string | undefined]>>,
]

export type strictRegExpExecArrayCases = [
  ExpectTrue<
    Equal<
      StrictRegExpExecArray<[true, false, boolean]>,
      RegExpExecArray &
        [string, string, undefined, string | undefined] & {
          indices?: RegExpIndicesArray &
            [
              RegExpIndexValue,
              RegExpIndexValue,
              undefined,
              RegExpIndexValue | undefined,
            ]
        }
    >
  >,
  ExpectTrue<
    Equal<
      StrictRegExpExecArray<[true, false] | [false, true]>,
      RegExpExecArray &
        ([string, string, undefined] | [string, undefined, string]) & {
          indices?: RegExpIndicesArray &
            (
              | [RegExpIndexValue, RegExpIndexValue, undefined]
              | [RegExpIndexValue, undefined, RegExpIndexValue]
            )
        }
    >
  >,
  ExpectTrue<
    Equal<
      StrictRegExpExecArray<1>,
      RegExpExecArray &
        [string, string] & {
          indices?: RegExpIndicesArray & [RegExpIndexValue, RegExpIndexValue]
        }
    >
  >,
  ExpectTrue<Equal<StrictRegExpExecArray<null>, RegExpExecArray>>,
]

export type strictRegExpIndicesArrayFromValuesCases = [
  ExpectTrue<
    Equal<
      StrictRegExpIndicesArrayFromValues<[true, false, boolean]>,
      RegExpIndicesArray &
        [
          [number, number],
          [number, number],
          undefined,
          [number, number] | undefined,
        ]
    >
  >,
  ExpectTrue<
    Equal<
      StrictRegExpIndicesArrayFromValues<[true, false] | [false, true]>,
      RegExpIndicesArray &
        (
          | [[number, number], [number, number], undefined]
          | [[number, number], undefined, [number, number]]
        )
    >
  >,
]
