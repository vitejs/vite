/* eslint-env node */
// import process from 'node:process'
import path from 'node:path'
import fs from 'node:fs'
import fse from 'fs-extra'

const pathRoot = process.cwd()
const pathDocs = path.resolve(pathRoot, 'docs')

const pathPackagesBase = 'packages/vite/src/node'
const pathPackages = path.resolve(pathRoot, pathPackagesBase)

const baseUrl = 'https://github.com/vitejs/vite/blob/main/'

const jsonOptions = { spaces: 2 }

const apis = [
  // hmr api
  // 'accept',
  // 'dispose',
  // 'prune',
  // 'data',
  // 'decline',
  // 'invalidate',
  // 'on',
  // 'send',

  // js api
  'createServer',
  'build',
  'preview',
  'resolveConfig',
  'mergeConfig',
  'searchForWorkspaceRoot',
  'loadEnv',
  'normalizePath',
  'transformWithEsbuild',
  'loadConfigFromFile',
  // plugins
]

// const types = [
//   // js
//   'InlineConfig',
//   'ResolvedConfig',
//   'ViteDevServer',
// ]

const pathSourceDirectoryData = path.resolve(
  pathDocs,
  '_scripts/source-data.json',
)
const sourceDirectoryData = readSourceDirectory(pathSourceDirectoryData)

const apiLinksPath = path.resolve(pathDocs, '_data/links.json')
const apiLinksData = readSourceFileContents(sourceDirectoryData)

outputApiLinks(apiLinksPath, apiLinksData)

// --------- //
// functions //
// --------- //

function readSourceDirectory(pathDirectoryData) {
  let directoryData

  if (fs.existsSync(pathDirectoryData)) {
    directoryData = fse.readJsonSync(pathDirectoryData)
    console.log(`Read cached data from ${pathDirectoryData}`)
  } else {
    // @todo force
    directoryData = createSourceDirectoryData(pathPackages)
    fse.outputJSONSync(pathDirectoryData, directoryData, jsonOptions)
    console.log(`Written data to ${pathDirectoryData}`)
  }

  return directoryData
}

function createSourceDirectoryData(itemPath, obj = {}) {
  const data = fs.readdirSync(itemPath)

  for (const item of data) {
    const currentPath = path.resolve(itemPath, item)
    const currentStat = fs.lstatSync(currentPath)

    // push file
    if (currentStat.isFile() && item.endsWith('.ts')) {
      const relativePath = path
        .relative(pathRoot, currentPath)
        .split(path.sep)
        .slice(0, -1)
        .join('/')

      if (!obj[relativePath]) obj[relativePath] = []

      obj[relativePath].push({
        name: item,
        path: relativePath,
        url: `${baseUrl}${relativePath}/${item}`,
      })
      continue
    }

    // skip
    if (currentStat.isDirectory() && item === '__tests__') continue

    // read dir
    if (currentStat.isDirectory()) {
      createSourceDirectoryData(currentPath, obj)
    }
  }

  return Object.values(obj).reduce((all, cur) => [...all, ...cur], [])
}

function readSourceFileContents(data) {
  const result = []

  for (const source of data) {
    const pathSource = path.resolve(pathRoot, source.path, source.name)
    const content = fs.readFileSync(pathSource)
    const lines = base64ToLines(content)

    for (const nameFn of apis) {
      // @todo
      // regex?
      // pattern does not match hmr methods
      // specifiy directory?
      const pattern = `function ${nameFn}(`
      const line = getLineNumber(lines, pattern)

      if (line < 0) continue

      const label = `${source.path}/${source.name}`
      const url = `${source.url}#L${line}`

      result.push([nameFn, label, url])
    }
  }

  return result
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .reduce((all, link) => {
      const [name, label, url] = link
      all[name] = {
        label,
        url,
      }
      return all
    }, {})
}

function base64ToLines(content) {
  return Buffer.from(content, 'base64').toString('utf-8').split('\n')
}

function getLineNumber(lines, string) {
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].includes(string)) return i + 1
  }

  return -1
}

function outputApiLinks(outputPath, outputData) {
  // @todo
  // export as .js - do not use stringify (adds double quotes to keys)
  // const output = `export const links = ${JSON.stringify(outputData, null, 2)}`
  // fse.outputFileSync(outputPath, output)

  fse.outputJSONSync(outputPath, outputData, jsonOptions)
  console.log(`Written data to ${outputPath}`)
}
