export interface Options {
  /**
   * default: 'defaults'
   */
  targets?: string | string[] | Record<string, string>
  /**
   * default: 'edge>=79, firefox>=67, chrome>=64, safari>=12, chromeAndroid>=64, iOS>=12'
   */
  modernTargets?: string | string[]
  /**
   * default: true
   */
  polyfills?: boolean | string[]
  additionalLegacyPolyfills?: string[]
  additionalModernPolyfills?: string[]
  /**
   * default: false
   */
  modernPolyfills?: boolean | string[]
  /**
   * default: true
   */
  renderLegacyChunks?: boolean
  /**
   * default: false
   */
  externalSystemJS?: boolean
  /**
   * default: true
   */
  renderModernChunks?: boolean
  /**
   * @see https://babeljs.io/docs/assumptions
   *
   * default: {}
   */
  assumptions?: Record<string, boolean>
}
