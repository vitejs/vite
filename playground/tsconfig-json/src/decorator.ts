// @ts-nocheck playground/tsconfig.json does not have decorators enabled
function first() {
  return function (...args: any[]) {}
}

export class Foo {
  @first()
  method(@first() test: string) {
    return test
  }
}
