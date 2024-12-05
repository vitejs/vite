type ConstructTuple<
  L extends number,
  V = unknown,
  R extends V[] = [],
> = R['length'] extends L ? R : ConstructTuple<L, V, [...R, V]>

export type BooleansToValues<Booleans extends readonly boolean[], Value> = {
  [K in keyof Booleans]: true extends Booleans[K]
    ? false extends Booleans[K]
      ? Value | undefined
      : Value
    : undefined
}

export type StrictRegExpExecArray<
  ValuesOrLen extends readonly boolean[] | number | null,
> = [ValuesOrLen] extends [null]
  ? RegExpExecArray
  : [ValuesOrLen] extends [number]
    ? StrictRegExpExecArrayFromValues<ConstructTuple<ValuesOrLen, true>>
    : [ValuesOrLen] extends [readonly boolean[]]
      ? StrictRegExpExecArrayFromValues<ValuesOrLen>
      : never

type StrictRegExpExecArrayFromValues<Values extends readonly boolean[]> =
  RegExpExecArray &
    [string, ...BooleansToValues<Values, string>] & {
      indices?: StrictRegExpIndicesArrayFromValues<Values>
    }

export type RegExpIndexValue = [number, number]

export type StrictRegExpIndicesArrayFromValues<
  Values extends readonly boolean[],
> = RegExpIndicesArray &
  [RegExpIndexValue, ...BooleansToValues<Values, RegExpIndexValue>]

export {}
