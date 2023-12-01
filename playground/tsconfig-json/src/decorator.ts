function first() {
  return function (...args: any[]) {}
}

export class Foo {
  @first()
  method(@first() test: string) {
    return test
  }
}
