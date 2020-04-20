const fs = require('fs')
const { parse } = require('@vue/compiler-sfc')

const cache = new Map()

exports.parseSFC = filename => {
  const content = fs.readFileSync(filename, 'utf-8')
  const { descriptor, errors } = parse(content, {
    filename
  })

  if (errors) {
    // TODO
  }

  const prev = cache.get(filename)
  cache.set(filename, descriptor)
  return [descriptor, prev]
}
