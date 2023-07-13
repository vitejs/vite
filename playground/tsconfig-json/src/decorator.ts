function first() {
  return function (...args: any[]) {}
}

export class Foo {
  @first()
  // @ts-expect-error we intentionally not enable `experimentalDecorators` to test esbuild compat
  method(@first test: string) {
    return test
  }
}
