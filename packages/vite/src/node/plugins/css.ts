export interface CSSOptions {}

export const cssPreprocessLangRE = /\.(less|sass|scss|styl|stylus|postcss)$/

export const isCSSRequest = (request: string) =>
  request.endsWith('.css') || cssPreprocessLangRE.test(request)
