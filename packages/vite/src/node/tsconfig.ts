import { resolveTsconfig as resolveTsconfigImpl } from 'rolldown/experimental'

export type ResolveTsconfigResult = NonNullable<
  ReturnType<typeof resolveTsconfigImpl>
>

/**
 * Resolve the `tsconfig.json` that applies to a file, using the same resolution
 * Vite uses internally. Returns the merged tsconfig and the list of config files
 * involved (useful for watching), or `null` if none is found.
 */
export function resolveTsconfig(
  filename: string,
): ResolveTsconfigResult | null {
  return resolveTsconfigImpl(filename)
}
