import postcssrc from 'postcss-load-config'

// postcss-load-config doesn't expose Result type
type Result = ReturnType<typeof postcssrc> extends Promise<infer T> ? T : never

let cachedPostcssConfig: Result | null | undefined

export async function loadPostcssConfig(root: string): Promise<Result | null> {
  try {
    return (
      cachedPostcssConfig || (cachedPostcssConfig = await postcssrc({}, root))
    )
  } catch (e) {
    return (cachedPostcssConfig = null)
  }
}
