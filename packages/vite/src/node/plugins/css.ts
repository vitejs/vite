export interface CSSOptions {}

export const cssPreprocessLangRE = /\.(css|less|sass|scss|styl|stylus|postcss)($|\?)/

export const isCSSRequest = (request: string) =>
  cssPreprocessLangRE.test(request)
