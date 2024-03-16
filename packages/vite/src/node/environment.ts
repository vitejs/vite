// We are using command: 'serve' | 'build' to aling with the command flag passed to hooks.
// It would be better if we would use 'dev' here but can tackle that if we managed to modify
// command at the hooks level. There could also be Preview environments later on.

export class Environment {
  name: string
  constructor(name: string) {
    this.name = name
  }
}
