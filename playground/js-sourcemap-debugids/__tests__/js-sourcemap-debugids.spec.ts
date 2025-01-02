import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'
import { isBuild, readFile, testDir } from '~utils'

function getDebugIdFromString(input: string): string | undefined {
  const match = input.match(/\/\/# debugId=([a-fA-F0-9-]+)/)
  return match ? match[1] : undefined
}

test.runIf(isBuild)('sourcemap debugids', () => {
  const assetsDir = path.resolve(testDir, 'dist/assets')
  const files = fs.readdirSync(assetsDir)

  const jsFile = files.find((f) => f.endsWith('.js'))
  const jsContent = readFile(path.resolve(assetsDir, jsFile))

  const sourceDebugId = getDebugIdFromString(jsContent)

  expect(sourceDebugId).toBeDefined()

  const mapFile = files.find((f) => f.endsWith('.js.map'))
  const mapContent = readFile(path.resolve(assetsDir, mapFile))

  const mapObj = JSON.parse(mapContent)
  const mapDebugId = mapObj.debugId

  expect(sourceDebugId).toEqual(mapDebugId)
})
