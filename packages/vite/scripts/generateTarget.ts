import { getCompatibleVersions } from 'baseline-browser-mapping'

// Update on each major release
const targetDate = '2026-01-01'

// https://esbuild.github.io/api/#target
const esbuildSupportedBrowsers = new Set([
  'chrome',
  'edge',
  'firefox',
  'safari',
])

const results = getCompatibleVersions({
  widelyAvailableOnDate: targetDate,
})

const esbuildTargets = results
  .filter((target) => esbuildSupportedBrowsers.has(target.browser))
  .map((target) => `${target.browser}${target.version}`)

console.log('ESBuild Targets:', esbuildTargets)
