import { multilineCommentsRE } from './utils'

export function emptyCssComments(raw: string) {
  return raw.replace(multilineCommentsRE, (s) => ' '.repeat(s.length))
}
