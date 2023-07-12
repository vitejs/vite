function first() {
  return function (...args: any[]) {}
}

export class Foo {
  @first()
  method() {}
}
