interface Foo {
  bar: string
}

export function throwError(foo?: Foo): void {
  throw new Error('method error')
}
