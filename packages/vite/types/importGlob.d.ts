export interface ImportGlobOptions<
  Eager extends boolean,
  AsType extends string
> {
  /**
   * Import type for the import url.
   */
  as?: AsType
  /**
   * Import as static or dynamic
   *
   * @default false
   */
  eager?: Eager
  /**
   * Import only the specific named export. Set to `default` to import the default export.
   */
  import?: string
  /**
   * Custom queries
   */
  query?: string | Record<string, string | number | boolean>
  /**
   * Search files also inside `node_modules/` and hidden directories (e.g. `.git/`). This might have impact on performance.
   *
   * @default false
   */
  exhaustive?: boolean
}

export type GeneralImportGlobOptions = ImportGlobOptions<boolean, string>

export interface KnownAsTypeMap {
  raw: string
  url: string
  worker: Worker
}

export interface ImportGlobFunction {
  /**
   * Import a list of files with a glob pattern.
   *
   * Overload 1: No generic provided, infer the type from `eager` and `as`
   */
  <
    Eager extends boolean,
    As extends string,
    T = As extends keyof KnownAsTypeMap ? KnownAsTypeMap[As] : unknown
  >(
    glob: string | string[],
    options?: ImportGlobOptions<Eager, As>
  ): (Eager extends true ? true : false) extends true
    ? Record<string, T>
    : Record<string, () => Promise<T>>
  /**
   * Import a list of files with a glob pattern.
   *
   * Overload 2: Module generic provided, infer the type from `eager: false`
   */
  <M>(
    glob: string | string[],
    options?: ImportGlobOptions<false, string>
  ): Record<string, () => Promise<M>>
  /**
   * Import a list of files with a glob pattern.
   *
   * Overload: 3 Module generic provided, infer the type from `eager: true`
   */
  <M>(
    glob: string | string[],
    options: ImportGlobOptions<true, string>
  ): Record<string, M>
}

export interface ImportGlobEagerFunction {
  /**
   * Eagerly import a list of files with a glob pattern.
   *
   * Overload 1: No generic provided, infer the type from `as`
   */
  <
    As extends string,
    T = As extends keyof KnownAsTypeMap ? KnownAsTypeMap[As] : unknown
  >(
    glob: string | string[],
    options?: Omit<ImportGlobOptions<boolean, As>, 'eager'>
  ): Record<string, T>
  /**
   * Eagerly import a list of files with a glob pattern.
   *
   * Overload 2: Module generic provided
   */
  <M>(
    glob: string | string[],
    options?: Omit<ImportGlobOptions<boolean, string>, 'eager'>
  ): Record<string, M>
}
