import { CompilerError } from '@vue/compiler-sfc'
import { RollupError } from 'rollup'

export function createRollupError(
  id: string,
  error: CompilerError | SyntaxError
): RollupError {
  if ('code' in error) {
    return {
      id,
      plugin: 'vue',
      message: error.message,
      parserError: error,
      loc: error.loc
        ? {
            file: id,
            line: error.loc.start.line,
            column: error.loc.start.column
          }
        : undefined
    }
  } else {
    return {
      id,
      plugin: 'vue',
      message: error.message,
      parserError: error
    }
  }
}
