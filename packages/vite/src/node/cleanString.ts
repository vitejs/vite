// bank on the non-overlapping nature of regex matches and combine all filters into one giant regex
// /`([^`\$\{\}]|\$\{(`|\g<1>)*\})*`/g can match nested string template
// but js not support match expression(\g<0>). so clean string template(`...`) in other ways.
const cleanerRE = /"[^"]*"|'[^']*'|\/\*(.|[\r\n])*?\*\/|\/\/.*/g

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
  // TODO replace string template
  return res
}

export function findEmptyStringRawIndex(
  clean: string,
  emptyFlag: string,
  start: number
): [number, number] {
  const flagIndex = clean.indexOf(emptyFlag, start)
  const flagEndIndex = flagIndex + emptyFlag.length
  return [flagIndex, flagEndIndex]
}
