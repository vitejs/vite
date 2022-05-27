// Modified and inlined to avoid extra dependency
// Source: https://github.com/guybedford/es-module-lexer/blob/main/types/lexer.d.ts
// MIT Licensed https://github.com/guybedford/es-module-lexer/blob/main/LICENSE

export interface ImportSpecifier {
  /**
   * Module name
   *
   * To handle escape sequences in specifier strings, the .n field of imported specifiers will be provided where possible.
   *
   * For dynamic import expressions, this field will be empty if not a valid JS string.
   *
   * @example
   * const [imports1, exports1] = parse(String.raw`import './\u0061\u0062.js'`);
   * imports1[0].n;
   * // Returns "./ab.js"
   *
   * const [imports2, exports2] = parse(`import("./ab.js")`);
   * imports2[0].n;
   * // Returns "./ab.js"
   *
   * const [imports3, exports3] = parse(`import("./" + "ab.js")`);
   * imports3[0].n;
   * // Returns undefined
   */
  readonly n: string | undefined
  /**
   * Start of module specifier
   *
   * @example
   * const source = `import { a } from 'asdf'`;
   * const [imports, exports] = parse(source);
   * source.substring(imports[0].s, imports[0].e);
   * // Returns "asdf"
   */
  readonly s: number
  /**
   * End of module specifier
   */
  readonly e: number

  /**
   * Start of import statement
   *
   * @example
   * const source = `import { a } from 'asdf'`;
   * const [imports, exports] = parse(source);
   * source.substring(imports[0].ss, imports[0].se);
   * // Returns `"import { a } from 'asdf';"`
   */
  readonly ss: number
  /**
   * End of import statement
   */
  readonly se: number

  /**
   * If this import statement is a dynamic import, this is the start value.
   * Otherwise this is `-1`.
   */
  readonly d: number

  /**
   * If this import has an import assertion, this is the start value.
   * Otherwise this is `-1`.
   */
  readonly a: number
}

/**
 * Wait for init to resolve before calling `parse`.
 */
export const init: Promise<void>

/**
 * Outputs the list of exports and locations of import specifiers,
 * including dynamic import and import meta handling.
 *
 * @param source - Source code to parser
 * @param name - Optional sourcename
 * @returns Tuple contaning imports list and exports list.
 */
export function parse(
  source: string,
  name?: string
): readonly [
  imports: ReadonlyArray<ImportSpecifier>,
  exports: ReadonlyArray<string>,
  facade: boolean
]
