export class HashSet<Value> {
  hashSet = new Map<string, Value>()
  getHash: (value: Value) => string

  constructor({
    getHash,
    initialValues,
  }: {
    /**
     * The hash function used for value retrieval in the `add`, `get`, `has`, and `delete` methods.
     */
    getHash: (value: Value) => string
    initialValues?: Value[]
  }) {
    this.getHash = getHash

    if (!initialValues) {
      return
    }

    this.hashSet = new Map<string, Value>(
      initialValues.map((value) => [this.getHash(value), value]),
    )
  }

  get size(): number {
    return this.hashSet.size
  }

  add(value: Value): HashSet<Value> {
    const hashedValue = this.getHash(value)
    this.hashSet.set(hashedValue, value)
    return this
  }

  clear(): void {
    return this.hashSet.clear()
  }

  delete(value: Value): boolean {
    const hashedValue = this.getHash(value)
    return this.hashSet.delete(hashedValue)
  }

  has(value: Value): boolean {
    const hashedValue = this.getHash(value)
    return this.hashSet.has(hashedValue)
  }

  get(value: Value): Value | undefined {
    const hashedValue = this.getHash(value)
    return this.hashSet.get(hashedValue)
  }

  values(): IterableIterator<Value> {
    return this.hashSet.values()
  }

  [Symbol.iterator](): IterableIterator<Value> {
    return this.hashSet.values()
  }
}
