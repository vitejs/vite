export type AnymatchFn = (testString: string) => boolean
export type AnymatchPattern = string | RegExp | AnymatchFn
type AnymatchMatcher = AnymatchPattern | AnymatchPattern[]

export { AnymatchMatcher as Matcher }
