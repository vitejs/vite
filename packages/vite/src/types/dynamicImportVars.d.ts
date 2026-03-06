export interface RollupDynamicImportVarsOptions {
  /**
   * Files to include in this plugin (default all).
   * @default []
   */
  include?: string | RegExp | (string | RegExp)[]
  /**
   * Files to exclude in this plugin (default none).
   * @default []
   */
  exclude?: string | RegExp | (string | RegExp)[]
  /**
   * @deprecated This option is no-op and will be removed in future versions.
   */
  warnOnError?: boolean
}
