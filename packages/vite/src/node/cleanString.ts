// bank on the non-overlapping nature of regex matches and combine all filters into one giant regex
// /`([^`\$\{\}]|\$\{(`|\g<1>)*\})*`/g can match nested string template
// but js not support match expression(\g<0>). so clean string template(`...`) in other ways.
const cleanerRE = /"[^"]*"|'[^']*'|\/\*(.|[\r\n])*?\*\/|\/\/.*/g

const blankReplacer = (s: string) => ' '.repeat(s.length)
const stringBlankReplacer = (s: string) =>
  `${s[0]}${'\0'.repeat(s.length - 2)}${s[0]}`

export function emptyString(raw: string): string {
  return raw.replace(cleanerRE, (s: string) =>
    s[0] === '/' ? blankReplacer(s) : stringBlankReplacer(s)
  )
}
