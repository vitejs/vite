import { CompilerError } from '@vue/compiler-sfc'
import { RollupError } from 'rollup'

export function createRollupError(
  id: string,
  error: CompilerError | SyntaxError
): RollupError {
  ;(error as RollupError).id = id
  ;(error as RollupError).plugin = 'vue'

  if ('code' in error && error.loc) {
    ;(error as any).loc = {
      file: id,
      line: error.loc.start.line,
      column: error.loc.start.column
    }
  }

  return error as RollupError
}
