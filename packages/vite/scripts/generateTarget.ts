import { getCompatibleVersions } from 'baseline-browser-mapping'

// Update on each major release
const targetDate = '2026-01-01'

// https://esbuild.github.io/api/#target
const baselineToEsbuildTargetMap: Record<string, string> = {
  chrome: 'chrome',
  edge: 'edge',
  firefox: 'firefox',
  safari: 'safari',
  safari_ios: 'ios',
}

const esbuildSupportedBrowsers = new Set([
  'chrome',
  'edge',
  'firefox',
  'safari',
  'ios',
])

const results = getCompatibleVersions({
  widelyAvailableOnDate: targetDate,
})

const esbuildTargets = results
  .map((target) => {
    return {
      browser: baselineToEsbuildTargetMap[target.browser],
      version: target.version,
    }
  })
  .filter((target) => esbuildSupportedBrowsers.has(target.browser))
  .map((target) => `${target.browser}${target.version}`)

console.log('ESBuild Targets:', esbuildTargets)
