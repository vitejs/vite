import type { Equal, ExpectTrue } from '@type-challenges/utils'
import type {
  BooleansToValues,
  StrictRegExpExecArray,
  StrictRegExpExecArrayFromLen,
  StrictRegExpIndicesArray,
  StrictRegExpIndicesArrayFromLen,
} from '../typeUtils'

export type booleansToValuesCases = [
  ExpectTrue<Equal<BooleansToValues<[true], string>, [string]>>,
  ExpectTrue<Equal<BooleansToValues<[false], string>, [undefined]>>,
  ExpectTrue<Equal<BooleansToValues<[boolean], string>, [string | undefined]>>,
]

export type strictRegExpExecArrayCases = [
  ExpectTrue<
    Equal<
      StrictRegExpExecArray<[true, false, boolean]>,
      RegExpExecArray & [string, string, undefined, string | undefined]
    >
  >,
  ExpectTrue<
    Equal<
      StrictRegExpExecArray<[true, false] | [false, true]>,
      RegExpExecArray &
        ([string, string, undefined] | [string, undefined, string])
    >
  >,
]

export type strictRegExpExecArrayFromLenCases = [
  ExpectTrue<
    Equal<StrictRegExpExecArrayFromLen<1>, RegExpExecArray & [string, string]>
  >,
]

export type strictRegExpIndicesArrayCases = [
  ExpectTrue<
    Equal<
      StrictRegExpIndicesArray<[true, false, boolean]>,
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
      StrictRegExpIndicesArray<[true, false] | [false, true]>,
      RegExpIndicesArray &
        (
          | [[number, number], [number, number], undefined]
          | [[number, number], undefined, [number, number]]
        )
    >
  >,
]

export type strictRegExpIndicesArrayFromLenCases = [
  ExpectTrue<
    Equal<
      StrictRegExpIndicesArrayFromLen<1>,
      RegExpIndicesArray & [[number, number], [number, number]]
    >
  >,
]
