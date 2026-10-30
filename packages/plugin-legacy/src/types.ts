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
   * Polyfills to remove from the automatically detected legacy polyfills.
   * Strings are polyfill specifiers, RegExps are tested against the import
   * path of each detected polyfill
   * (e.g. `core-js/modules/es.json.stringify.js`).
   */
  excludeLegacyPolyfills?: (string | RegExp)[]
  /**
   * Polyfills to remove from the automatically detected modern polyfills.
   * Strings are polyfill specifiers, RegExps are tested against the import
   * path of each detected polyfill
   * (e.g. `core-js/modules/es.json.stringify.js`).
   */
  excludeModernPolyfills?: (string | RegExp)[]
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
