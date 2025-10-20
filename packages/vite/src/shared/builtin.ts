export function createIsBuiltin(
  builtins: (string | RegExp)[],
): (id: string) => boolean {
  const plainBuiltinsSet = new Set(
    builtins.filter((builtin) => typeof builtin === 'string'),
  )
  const regexBuiltins = builtins.filter(
    (builtin) => typeof builtin !== 'string',
  )

  return (id: string) =>
    plainBuiltinsSet.has(id) || regexBuiltins.some((regexp) => regexp.test(id))
}
