import postcssrc from 'postcss-load-config'

// postcss-load-config doesn't expose Result type
type Result = ReturnType<typeof postcssrc> extends Promise<infer T> ? T : never

let cachedPostcssConfig: Result | null | undefined

export async function loadPostcssConfig(root: string): Promise<Result | null> {
  if (cachedPostcssConfig !== undefined) {
    return cachedPostcssConfig
  }
  try {
    const load = require('postcss-load-config') as typeof postcssrc
    return (cachedPostcssConfig = await load({}, root))
  } catch (e) {
    return (cachedPostcssConfig = null)
  }
}
