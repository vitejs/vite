export function createIsBuiltin(
  builtins: (string | RegExp)[],
): (id: string) => boolean {
  const plainBuiltinsSet = new Set(
    builtins.filter(
      (builtin): builtin is string => typeof builtin === 'string',
    ),
  )
  const regexBuiltins = builtins.filter(
    (builtin): builtin is RegExp => builtin instanceof RegExp,
  )

  return (id: string) =>
    plainBuiltinsSet.has(id) || regexBuiltins.some((regexp) => regexp.test(id))
}
