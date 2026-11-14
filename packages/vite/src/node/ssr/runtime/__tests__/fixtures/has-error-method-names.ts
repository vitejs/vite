const object = {
  get foo(): never {
    throw new Error('getter')
  },
}

class F {
  m(): never {
    throw new Error('method')
  }
}

Object.defineProperty(F.prototype.m, 'name', { value: 'Foo' })

class AstralName {
  m(): never {
    throw new Error('astral name')
  }
}

Object.defineProperty(AstralName.prototype.m, 'name', { value: '𐐀' })

export function callGetter(): void {
  object.foo
}

export function callAliasedMethod(): void {
  new F().m()
}

export function callAstralNamedMethod(): void {
  new AstralName().m()
}
