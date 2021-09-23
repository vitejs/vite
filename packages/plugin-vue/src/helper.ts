export const EXPORT_HELPER_ID = 'plugin-vue:export-helper'

export const helperCode = `
export default (sfc, props) => {
  for (const [key, val] of props) {
    sfc[key] = val
  }
  return sfc
}
`
