const fs = require('fs').promises
const { parse } = require('@vue/compiler-sfc')

const cache = new Map()

exports.parseSFC = async (filename, saveCache = false) => {
  const content = await fs.readFile(filename, 'utf-8')
  const { descriptor, errors } = parse(content, {
    filename
  })

  if (errors) {
    // TODO
  }

  const prev = cache.get(filename)
  if (saveCache) {
    cache.set(filename, descriptor)
  }
  return [descriptor, prev]
}
