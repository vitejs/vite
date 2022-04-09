// bank on the non-overlapping nature of regex matches
// and combine all our current filters into one giant regex
// FIXME: nested string template (PS: `${`${}`}`)
const cleanerRE = /"[^"]*"|'[^']*'|`[^`]*`|\/\*(.|[\r\n])*?\*\/|\/\/.*/g

const blankReplacer = (s: string) => ' '.repeat(s.length)
const stringBlankReplacer = (s: string) =>
  `${s[0]}${'\0'.repeat(s.length - 2)}${s[0]}`

export interface CleanString {
  clean: string
  raw: string
}

function isCleanString(obj: any): obj is CleanString {
  return obj.raw && obj.clean
}

export function emptyCommentsString(raw: string): CleanString {
  const res: CleanString = {
    raw: raw,
    clean: raw.replace(cleanerRE, (s: string) =>
      s[0] === '/' ? blankReplacer(s) : s
    )
  }
  return res
}

export function emptyString(raw: string | CleanString): CleanString {
  const res: CleanString = { raw: '', clean: '' }
  if (isCleanString(raw)) {
    res.raw = raw.raw
    res.clean = raw.clean
  } else {
    res.raw = raw
    res.clean = raw
  }
  res.clean = res.clean.replace(cleanerRE, (s: string) =>
    s[0] === '/' ? blankReplacer(s) : stringBlankReplacer(s)
  )
  return res
}

export function findEmptyStringRawIndex(
  raw: CleanString,
  emptyFlag: string,
  start: number
): [number, number] {
  const flagIndex = raw.clean.indexOf(emptyFlag, start)
  const flagEndIndex = flagIndex + emptyFlag.length
  return [flagIndex, flagEndIndex]
}

export async function walkCleanString(
  re: RegExp,
  raw: string,
  callback: (match: RegExpExecArray, cleanString: CleanString) => Promise<void>
): Promise<void> {
  const cleanString = emptyString(raw)
  let match: RegExpExecArray | null
  while ((match = re.exec(cleanString.clean))) {
    await callback(match, cleanString)
  }
}

export function walkCleanStringSync(
  re: RegExp,
  raw: string,
  callback: (match: RegExpExecArray, cleanString: CleanString) => void
): void {
  const cleanString = emptyString(raw)
  let match: RegExpExecArray | null
  while ((match = re.exec(cleanString.clean))) {
    callback(match, cleanString)
  }
}
