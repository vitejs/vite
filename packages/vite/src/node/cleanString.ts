// bank on the non-overlapping nature of regex matches
// and combine all our current filters into one giant regex
// FIXME: nested string template (PS: `${`${}`}`)
const cleanerRE = /"[^"]*"|'[^']*'|`[^`]*`|\/\*(.|[\r\n])*?\*\/|\/\/.*/g

const blankReplacer = (s: string) => '\0'.repeat(s.length)
const stringBlankReplacer = (s: string) =>
  `${s[0]}${'\0'.repeat(s.length - 2)}${s[0]}`

export class CleanCommentString extends String {
  clean = ''
  raw = ''

  constructor(raw: string) {
    super(raw.toString())
    this.raw = raw
    this.clean = raw.replace(cleanerRE, (s: string) =>
      s[0] === '/' ? blankReplacer(s) : s
    )
  }

  override toString() {
    return this.clean
  }
}

export class CleanString extends String {
  clean = ''
  raw = ''

  constructor(raw: string | CleanCommentString) {
    super(raw.toString())
    if (raw instanceof CleanCommentString) {
      this.raw = raw.raw
      this.clean = raw.clean.replace(cleanerRE, (s: string) =>
        s[0] === '/' ? blankReplacer(s) : stringBlankReplacer(s)
      )
    } else {
      this.raw = raw
      this.clean = raw.replace(cleanerRE, (s: string) =>
        s[0] === '/' ? blankReplacer(s) : stringBlankReplacer(s)
      )
    }
  }

  override toString() {
    return this.clean
  }
}

export function emptyCommentsString(raw: string): CleanCommentString {
  return new CleanCommentString(raw)
}

export function emptyString(raw: string | CleanCommentString): CleanString {
  return new CleanString(raw)
}

export function findEmptyStringRawIndex(
  raw: CleanString,
  emptyFlag: string,
  start: number
): [number, number] {
  // FIXME: if there are sub-strings of the same length in the same string. (PS: fn('   ', '   '))
  const flagIndex = raw.clean.indexOf(emptyFlag, start)
  const flagEndIndex = flagIndex + emptyFlag.length
  return [flagIndex, flagEndIndex]
}
