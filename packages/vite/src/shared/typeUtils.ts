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

export type StrictRegExpExecArray<Values extends readonly boolean[]> =
  RegExpExecArray & [string, ...BooleansToValues<Values, string>]

export type StrictRegExpExecArrayFromLen<Length extends number> =
  StrictRegExpExecArray<ConstructTuple<Length, true>>

export type StrictRegExpIndicesArray<Values extends readonly boolean[]> =
  RegExpIndicesArray &
    [[number, number], ...BooleansToValues<Values, [number, number]>]

export type StrictRegExpIndicesArrayFromLen<Length extends number> =
  StrictRegExpIndicesArray<ConstructTuple<Length, true>>
