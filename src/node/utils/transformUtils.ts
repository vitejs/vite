export function genSourceMapString(map: object | string | undefined) {
  if (!map) {
    return ''
  }
  if (typeof map !== 'string') {
    map = JSON.stringify(map)
  }
  return `\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(
    map
  ).toString('base64')}`
}

export async function asyncReplace(
  input: string,
  re: RegExp,
  replacer: (match: RegExpExecArray) => string | Promise<string>
) {
  let match: RegExpExecArray | null
  let remaining = input
  let rewritten = ''
  while ((match = re.exec(remaining))) {
    rewritten += remaining.slice(0, match.index)
    rewritten += await replacer(match)
    remaining = remaining.slice(match.index + match[0].length)
  }
  rewritten += remaining
  return rewritten
}
