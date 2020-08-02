import { SourceNode, RawSourceMap } from 'source-map'

const SPLIT_REGEX = /(?!$)[^\n\r;{}]*[\n\r;{}]*/g

function splitCode(code: string) {
  return code.match(SPLIT_REGEX) || []
}

export function getOriginalSourceMap(
  code: string,
  filePath: string
): RawSourceMap {
  const lines = code.split('\n')

  const linesSourceNode = lines.map((row, index) => {
    let column = 0
    const columnsSourceNode = splitCode(
      row + (index !== lines.length - 1 ? '\n' : '')
    ).map((item) => {
      if (/^\s*$/.test(item)) {
        column += item.length
        return item
      }
      const res = new SourceNode(index + 1, column, filePath, item)
      column += item.length
      return res
    })
    return new SourceNode(null, null, null, columnsSourceNode)
  })

  const sourceNode = new SourceNode(null, null, null, linesSourceNode)

  const sourceMapGenerator = sourceNode.toStringWithSourceMap({
    file: filePath
  }).map
  sourceMapGenerator.setSourceContent(filePath, code)
  return sourceMapGenerator.toJSON()
}
