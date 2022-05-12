import type { CompilerError } from 'vue/compiler-sfc'
import type { RollupError } from 'rollup'

export function createRollupError(
  id: string,
  error: CompilerError | SyntaxError
): RollupError {
  const { message, name, stack } = error
  const rollupError: RollupError = {
    id,
    plugin: 'vue',
    message,
    name,
    stack
  }

  if ('code' in error && error.loc) {
    rollupError.loc = {
      file: id,
      line: error.loc.start.line,
      column: error.loc.start.column
    }
  }

  return rollupError
}
