// Project: https://github.com/stylus/stylus
// Definitions by: Maxime LUCE <https://github.com/SomaticIT>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.2

/// <reference types="node" />

import { EventEmitter } from 'events'

declare var stylus: Stylus.Static
export = stylus

declare namespace Stylus {
  export interface Static {
    /**
     * Return a new `Renderer` for the given `str` and `options`.
     */
    (str: string): Renderer
    (str: string, options: RenderOptions): Renderer

    /**
     * Library version.
     */
    version: string

    /**
     * Expose nodes.
     */
    nodes: NodeStatic

    /**
     * Expose BIFs.
     */
    functions: Functions

    /**
     * Expose utils.
     */
    utils: Utils

    Visitor: typeof Visitor
    Parser: typeof Parser
    Evaluator: typeof Evaluator
    Compiler: typeof Compiler

    /**
     * Expose middleware.
     */
    middleware(dir: string): Middleware
    middleware(options: any): Middleware

    /**
     * Convert the given `css` to `stylus` source.
     */
    convertCSS(css: string): string

    /**
     * Render the given `str` with `options` and callback `fn(err, css)`.
     */
    render(str: string, callback: RenderCallback): void
    render(str: string, options: RenderOptions, callback: RenderCallback): void

    /**
     * Return a url() function with the given `options`.
     */
    url: UrlFunction

    /**
     * Return a url() function with the given `options`.
     */
    resolver(options: any): LiteralFunction
  }

  //#region Internal Modules

  export interface NodeStatic {
    Node: typeof Nodes.Node
    Root: typeof Nodes.Root
    Null: typeof Nodes.Null
    Each: typeof Nodes.Each
    If: typeof Nodes.If
    Call: typeof Nodes.Call
    UnaryOp: typeof Nodes.UnaryOp
    BinOp: typeof Nodes.BinOp
    Ternary: typeof Nodes.Ternary
    Block: typeof Nodes.Block
    Unit: typeof Nodes.Unit
    String: typeof Nodes.String
    HSLA: typeof Nodes.HSLA
    RGBA: typeof Nodes.RGBA
    Ident: typeof Nodes.Ident
    Group: typeof Nodes.Group
    Literal: typeof Nodes.Literal
    Boolean: typeof Nodes.Boolean
    Return: typeof Nodes.Return
    Media: typeof Nodes.Media
    QueryList: typeof Nodes.QueryList
    Query: typeof Nodes.Query
    QueryExpr: typeof Nodes.QueryExpr
    Params: typeof Nodes.Params
    Comment: typeof Nodes.Comment
    Keyframes: typeof Nodes.Keyframes
    Member: typeof Nodes.Member
    Charset: typeof Nodes.Charset
    Namespace: typeof Nodes.Namespace
    Import: typeof Nodes.Import
    Extend: typeof Nodes.Extend
    Object: typeof Nodes.Object
    Function: typeof Nodes.Function
    Property: typeof Nodes.Property
    Selector: typeof Nodes.Selector
    Expression: typeof Nodes.Expression
    Arguments: typeof Nodes.Arguments
    Atblock: typeof Nodes.Atblock
    Atrule: typeof Nodes.Atrule

    true: Nodes.Boolean
    false: Nodes.Boolean
    null: Nodes.Null
  }

  export interface Functions {
    /**
     * Convert the given `color` to an `HSLA` node,
     * or h,s,l,a component values.
     */
    hsla(rgba: Nodes.RGBA): Nodes.HSLA
    hsla(hsla: Nodes.HSLA): Nodes.HSLA
    hsla(
      hue: Nodes.Unit,
      saturation: Nodes.Unit,
      lightness: Nodes.Unit,
      alpha: Nodes.Unit
    ): Nodes.HSLA

    /**
     * Convert the given `color` to an `HSLA` node,
     * or h,s,l component values.
     */
    hsl(rgba: Nodes.RGBA): Nodes.HSLA
    hsl(hsla: Nodes.HSLA): Nodes.HSLA
    hsl(
      hue: Nodes.Unit,
      saturation: Nodes.Unit,
      lightness: Nodes.Unit
    ): Nodes.HSLA

    /**
     * Return type of `node`.
     */
    type(node: Nodes.Node): string
    /**
     * Return type of `node`.
     */
    typeof(node: Nodes.Node): string
    /**
     * Return type of `node`.
     */
    'type-of'(node: Nodes.Node): string

    /**
     * Return component `name` for the given `color`.
     */
    component(color: Nodes.RGBA, name: Nodes.String): Nodes.Unit
    component(color: Nodes.HSLA, name: Nodes.String): Nodes.Unit

    /**
     * Return component `name` for the given `color`.
     */
    basename(path: Nodes.String): string
    basename(path: Nodes.String, ext: Nodes.String): string

    /**
     * Return the dirname of `path`.
     */
    dirname(path: Nodes.String): string

    /**
     * Return the extension of `path`.
     */
    extname(path: Nodes.String): string

    /**
     * Joins given paths
     */
    pathjoin(...paths: Nodes.String[]): string

    /**
     * Return the red component of the given `color`,
     * or set the red component to the optional second `value` argument.
     */
    red(color: Nodes.RGBA): Nodes.Unit
    red(color: Nodes.HSLA): Nodes.Unit
    red(color: Nodes.RGBA, value: Nodes.Unit): Nodes.RGBA
    red(color: Nodes.HSLA, value: Nodes.Unit): Nodes.RGBA

    /**
     * Return the green component of the given `color`,
     * or set the green component to the optional second `value` argument.
     */
    green(color: Nodes.RGBA): Nodes.Unit
    green(color: Nodes.HSLA): Nodes.Unit
    green(color: Nodes.RGBA, value: Nodes.Unit): Nodes.RGBA
    green(color: Nodes.HSLA, value: Nodes.Unit): Nodes.RGBA

    /**
     * Return the blue component of the given `color`,
     * or set the blue component to the optional second `value` argument.
     */
    blue(color: Nodes.RGBA): Nodes.Unit
    blue(color: Nodes.HSLA): Nodes.Unit
    blue(color: Nodes.RGBA, value: Nodes.Unit): Nodes.RGBA
    blue(color: Nodes.HSLA, value: Nodes.Unit): Nodes.RGBA

    /**
     * Return the alpha component of the given `color`,
     * or set the alpha component to the optional second `value` argument.
     */
    alpha(color: Nodes.RGBA): Nodes.Unit
    alpha(color: Nodes.HSLA): Nodes.Unit
    alpha(color: Nodes.RGBA, value: Nodes.Unit): Nodes.RGBA
    alpha(color: Nodes.HSLA, value: Nodes.Unit): Nodes.RGBA

    /**
     * Return the hue component of the given `color`,
     * or set the hue component to the optional second `value` argument.
     */
    hue(color: Nodes.RGBA): Nodes.Unit
    hue(color: Nodes.HSLA): Nodes.Unit
    hue(color: Nodes.RGBA, value: Nodes.Unit): Nodes.RGBA
    hue(color: Nodes.HSLA, value: Nodes.Unit): Nodes.RGBA

    /**
     * Return the saturation component of the given `color`,
     * or set the saturation component to the optional second `value` argument.
     */
    saturation(color: Nodes.RGBA): Nodes.Unit
    saturation(color: Nodes.HSLA): Nodes.Unit
    saturation(color: Nodes.RGBA, value: Nodes.Unit): Nodes.RGBA
    saturation(color: Nodes.HSLA, value: Nodes.Unit): Nodes.RGBA

    /**
     * Return the lightness component of the given `color`,
     * or set the lightness component to the optional second `value` argument.
     */
    lightness(color: Nodes.RGBA): Nodes.Unit
    lightness(color: Nodes.HSLA): Nodes.Unit
    lightness(color: Nodes.RGBA, value: Nodes.Unit): Nodes.RGBA
    lightness(color: Nodes.HSLA, value: Nodes.Unit): Nodes.RGBA

    /**
     * Return a `RGBA` from the r,g,b,a channels.
     */
    rgba(rgba: Nodes.RGBA): Nodes.RGBA
    rgba(hsla: Nodes.HSLA): Nodes.RGBA
    rgba(
      hue: Nodes.Unit,
      saturation: Nodes.Unit,
      lightness: Nodes.Unit,
      alpha: Nodes.Unit
    ): Nodes.RGBA

    /**
     * Return a `RGBA` from the r,g,b channels.
     */
    rgb(rgba: Nodes.RGBA): Nodes.RGBA
    rgb(hsla: Nodes.HSLA): Nodes.RGBA
    rgb(
      hue: Nodes.Unit,
      saturation: Nodes.Unit,
      lightness: Nodes.Unit,
      alpha: Nodes.Unit
    ): Nodes.RGBA

    /**
     * Blend the `top` color over the `bottom`
     */
    blend(top: Nodes.RGBA): Nodes.RGBA
    blend(top: Nodes.RGBA, bottom: Nodes.RGBA): Nodes.RGBA
    blend(top: Nodes.RGBA, bottom: Nodes.HSLA): Nodes.RGBA
    blend(top: Nodes.HSLA): Nodes.RGBA
    blend(top: Nodes.HSLA, bottom: Nodes.RGBA): Nodes.RGBA
    blend(top: Nodes.HSLA, bottom: Nodes.HSLA): Nodes.RGBA

    /**
     * Returns the relative luminance of the given `color`,
     * see http://www.w3.org/TR/WCAG20/#relativeluminancedef
     */
    luminosity(rgba: Nodes.RGBA): Nodes.Unit
    luminosity(rgba: Nodes.HSLA): Nodes.Unit

    /**
     * Returns the contrast ratio object between `top` and `bottom` colors,
     * based on http://leaverou.github.io/contrast-ratio/
     * and https://github.com/LeaVerou/contrast-ratio/blob/gh-pages/color.js#L108
     */
    contrast(top: Nodes.RGBA): Nodes.Object
    contrast(top: Nodes.RGBA, bottom: Nodes.RGBA): Nodes.Object
    contrast(top: Nodes.RGBA, bottom: Nodes.HSLA): Nodes.Object
    contrast(top: Nodes.HSLA): Nodes.Object
    contrast(top: Nodes.HSLA, bottom: Nodes.RGBA): Nodes.Object
    contrast(top: Nodes.HSLA, bottom: Nodes.HSLA): Nodes.Object

    /**
     * Returns the transparent version of the given `top` color,
     * as if it was blend over the given `bottom` color.
     */
    transparentify(top: Nodes.RGBA): Nodes.Object
    transparentify(
      top: Nodes.RGBA,
      bottom: Nodes.RGBA,
      alpha?: Nodes.Unit
    ): Nodes.Object
    transparentify(
      top: Nodes.RGBA,
      bottom: Nodes.HSLA,
      alpha?: Nodes.Unit
    ): Nodes.Object
    transparentify(top: Nodes.HSLA): Nodes.Object
    transparentify(
      top: Nodes.HSLA,
      bottom: Nodes.RGBA,
      alpha?: Nodes.Unit
    ): Nodes.Object
    transparentify(
      top: Nodes.HSLA,
      bottom: Nodes.HSLA,
      alpha?: Nodes.Unit
    ): Nodes.Object

    /**
     * Convert a .json file into stylus variables or object.
     * Nested variable object keys are joined with a dash (-)
     *
     * Given this sample media-queries.json file:
     * {
     *   "small": "screen and (max-width:400px)",
     *   "tablet": {
     *     "landscape": "screen and (min-width:600px) and (orientation:landscape)",
     *     "portrait": "screen and (min-width:600px) and (orientation:portrait)"
     *   }
     * }
     */
    json(
      path: Nodes.String,
      local: Nodes.Boolean,
      namePrefix: Nodes.String
    ): any

    /**
     * Use the given `plugin`.
     */
    use(plugin: Nodes.String): void
    use(plugin: Nodes.String, options: any): void

    /**
     * Unquote the given `string`.
     */
    unquote(str: Nodes.String): Nodes.Literal

    /**
     * Like `unquote` but tries to convert the given `str` to a Stylus node.
     */
    convert(str: Nodes.String): Nodes.Node

    /**
     * Assign `type` to the given `unit` or return `unit`'s type.
     */
    unit(unit: Nodes.Unit, type: Nodes.String): Nodes.Unit

    /**
     * Lookup variable `name` or return Null.
     */
    lookup(name: Nodes.String): Nodes.Node

    /**
     * Set a variable `name` on current scope.
     */
    define(name: Nodes.String, expr: Nodes.Expression): Nodes.Node

    /**
     * Perform `op` on the `left` and `right` operands.
     */
    operate(op: Nodes.String, left: Nodes.Node, right: Nodes.Node): Nodes.Node

    /**
     * Test if `val` matches the given `pattern`.
     */
    match(pattern: Nodes.String, val: Nodes.String): Nodes.Boolean
    match(pattern: Nodes.String, val: Nodes.Ident): Nodes.Boolean

    /**
     * Returns substring of the given `val`.
     */
    substr(
      val: Nodes.String,
      start: Nodes.Number,
      length: Nodes.Number
    ): Nodes.String
    substr(
      val: Nodes.Ident,
      start: Nodes.Number,
      length: Nodes.Number
    ): Nodes.Ident

    /**
     * Returns string with all matches of `pattern` replaced by `replacement` in given `val`
     */
    replace(
      pattern: Nodes.String,
      replacement: Nodes.String,
      val: Nodes.String
    ): Nodes.String
    replace(
      pattern: Nodes.String,
      replacement: Nodes.String,
      val: Nodes.Ident
    ): Nodes.Ident

    /**
     * Splits the given `val` by `delim`
     */
    split(pattern: Nodes.String, val: Nodes.String): Nodes.Expression
    split(pattern: Nodes.String, val: Nodes.Ident): Nodes.Expression

    /**
     * Return length of the given `expr`.
     */
    length(expr: Nodes.Expression): Nodes.Unit

    /**
     * Inspect the given `expr`.
     */
    length(...expr: Nodes.Expression[]): Nodes.Null

    /**
     * Throw an error with the given `msg`.
     */
    error(msg: Nodes.String): void

    /**
     * Warn with the given `msg` prefixed by "Warning: ".
     */
    warn(msg: Nodes.String): Nodes.Null

    /**
     * Output stack trace.
     */
    trace(): Nodes.Null

    /**
     * Push the given args to `expr`.
     */
    push(expr: Nodes.Expression, ...nodes: Nodes.Node[]): Nodes.Unit

    /**
     * Pop a value from `expr`.
     */
    pop(expr: Nodes.Expression): Nodes.Node

    /**
     * Unshift the given args to `expr`.
     */
    unshift(expr: Nodes.Expression, ...nodes: Nodes.Node[]): Nodes.Unit

    /**
     * Unshift the given args to `expr`..
     */
    prepend(expr: Nodes.Expression, ...nodes: Nodes.Node[]): Nodes.Unit

    /**
     * Shift a value from `expr`.
     */
    shift(expr: Nodes.Expression): Nodes.Node

    /**
     * Return a `Literal` with the given `fmt`, and variable number of arguments.
     */
    s(fmt: Nodes.String, ...nodes: Nodes.Node[]): Nodes.Literal

    /**
     * Return a `Literal` `num` converted to the provided `base`, padded to `width`
     * with zeroes (default width is 2)
     */
    'base-convert'(
      num: Nodes.Number,
      base: Nodes.Number,
      width: Nodes.Number
    ): Nodes.Literal

    /**
     * Return the opposites of the given `positions`.
     */
    'opposite-position'(positions: Nodes.Expression): Nodes.Expression

    /**
     * Return the width and height of the given `img` path.
     */
    'image-size'(img: Nodes.String, ignoreErr: Nodes.Boolean): Nodes.Expression

    /**
     * Return the tangent of the given `angle`.
     */
    tan(angle: Nodes.Unit): Nodes.Unit

    /**
     * Return the tangent of the given `angle`.
     */
    math(n: Nodes.Unit, fn: Nodes.String): Nodes.Unit

    /**
     * Return the opposites of the given `positions`.
     */
    '-math-prop'(prop: Nodes.String): Nodes.Unit

    /**
     * Adjust HSL `color` `prop` by `amount`.
     */
    adjust(rgba: Nodes.RGBA, prop: Nodes.String, amount: Nodes.Unit): Nodes.RGBA
    adjust(hsla: Nodes.HSLA, prop: Nodes.String, amount: Nodes.Unit): Nodes.RGBA

    /**
     * Return a clone of the given `expr`.
     */
    clone(expr: Nodes.Expression): Nodes.Expression

    /**
     * Add property `name` with the given `expr` to the mixin-able block.
     */
    'add-property'(name: Nodes.String, expr: Nodes.Expression): Nodes.Property

    /**
     * Merge the object `dest` with the given args.
     */
    merge(dest: Nodes.Object, ...objs: Nodes.Object[]): Nodes.Object

    /**
     * Merge the object `dest` with the given args.
     */
    extend(dest: Nodes.Object, ...objs: Nodes.Object[]): Nodes.Object

    /**
     * Return the current selector or compile `sel` selector.
     */
    selector(): string
    selector(sel: Nodes.String): string

    /**
     * Prefix css classes in a block
     */
    '-prefix-classes'(prefix: Nodes.String, block: Nodes.Block): Nodes.Block

    /**
     * Returns the @media string for the current block
     */
    'current-media'(): Nodes.String

    /**
     * Return the separator of the given `list`.
     */
    'list-separator'(list: Nodes.Expression): Nodes.String
  }

  export interface Utils {
    /**
     * Check if `path` looks absolute.
     */
    absolute(path: string): boolean

    /**
     * Attempt to lookup `path` within `paths` from tail to head.
     * Optionally a path to `ignore` may be passed.
     */
    lookup(
      path: string,
      paths: string,
      ignore: string,
      resolveURL: boolean
    ): string

    /**
     * Attempt to lookup `path` within `paths` from tail to head.
     * Optionally a path to `ignore` may be passed.
     */
    lookupIndex(path: string, paths: string, filename: string): string[]

    /**
     * Like `utils.lookup` but uses `glob` to find files.
     */
    find(path: string, paths: string, ignore: string): string[]

    /**
     * Format the given `err` with the given `options`.
     */
    formatException(err: Error, options: ExceptionOptions): Error

    /**
     * Assert that `node` is of the given `type`, or throw.
     */
    assertType(node: Nodes.Node, type: string, param: string): void

    /**
     * Assert that `node` is a `String` or `Ident`.
     */
    assertString(node: Nodes.Node, param: string): void

    /**
     * Assert that `node` is a `RGBA` or `HSLA`.
     */
    assertColor(node: Nodes.Node, param: string): void

    /**
     * Assert that param `name` is given, aka the `node` is passed.
     */
    assertPresent(node: Nodes.Node, name: string): void

    /**
     * Unwrap `expr`.
     *
     * Takes an expressions with length of 1
     * such as `((1 2 3))` and unwraps it to `(1 2 3)`.
     */
    unwrap(expr: Nodes.Expression): Nodes.Node

    /**
     * Coerce JavaScript values to their Stylus equivalents.
     */
    coerce(val: any): Nodes.Node
    coerce(val: any, raw: boolean): Nodes.Node

    /**
     * Coerce a javascript `Array` to a Stylus `Expression`.
     */
    coerceArray(val: any): Nodes.Expression
    coerceArray(val: any, raw: boolean): Nodes.Expression

    /**
     * Coerce a javascript object to a Stylus `Expression` or `Object`.
     *
     * For example `{ foo: 'bar', bar: 'baz' }` would become
     * the expression `(foo 'bar') (bar 'baz')`. If `raw` is true
     * given `obj` would become a Stylus hash object.
     */
    coerceObject(obj: any): Nodes.Expression
    coerceObject(obj: any, raw: boolean): Nodes.Expression

    /**
     * Return param names for `fn`.
     */
    params(fn: (...args: any[]) => any): string[]

    /**
     * Merge object `b` with `a`.
     */
    merge(a: any, b: any): any

    /**
     * Returns an array with unique values.
     */
    uniq(arr: any[]): any[]

    /**
     * Compile selector strings in `arr` from the bottom-up
     * to produce the selector combinations. For example
     * the following Stylus:
     */
    compileSelectors(arr: string[], leaveHidden: boolean): string[]
  }

  export interface UrlFunction {
    (options?: UrlOptions): LiteralFunction

    mimes: {
      '.gif': string
      '.png': string
      '.jpg': string
      '.jpeg': string
      '.svg': string
      '.ttf': string
      '.eot': string
      '.woff': string
    }
  }

  export type Middleware = (
    req: any,
    res: any,
    next: (...args: any[]) => any
  ) => void

  //#endregion

  //#region Internal Classes

  export class Visitor {}

  export class Parser {}

  export class Evaluator {}

  export class Compiler {}

  export class Renderer extends EventEmitter {
    options: RenderOptions
    str: string
    events: any

    constructor(str: string)
    constructor(str: string, options: RenderOptions)

    /**
     * Parse and evaluate AST, then callback `fn(err, css, js)`.
     */
    render(callback: RenderCallback): void

    /**
     * Parse and evaluate AST and return the result.
     */
    render(): string

    /**
     * Get dependencies of the compiled file.
     */
    deps(filename?: string): string[]

    /**
     * Set option `key` to `val`.
     */
    set(key: string, val: any): this

    /**
     * Get option `key`.
     */
    get(key: string): any

    /**
     * Include the given `path` to the lookup paths array.
     */
    include(path: string): this

    /**
     * Use the given `fn`.
     *
     * This allows for plugins to alter the renderer in
     * any way they wish, exposing paths etc.
     */
    use(fn: (renderer: Renderer) => any): this

    /**
     * Define function or global var with the given `name`. Optionally
     * the function may accept full expressions, by setting `raw`
     * to `true`.
     */
    define(name: string, fn: (...args: any[]) => any): this
    define(name: string, node: Nodes.Node): this
    define(name: string, val: any): this
    define(name: string, fn: (...args: any[]) => any, raw: boolean): this
    define(name: string, node: Nodes.Node, raw: boolean): this
    define(name: string, val: any, raw: boolean): this

    /**
     * Import the given `file`.
     */
    import(file: string): this

    //#region EventEmitter Members
    addListener(event: string, listener: (...args: any[]) => any): this
    on(event: string, listener: (...args: any[]) => any): this
    once(event: string, listener: (...args: any[]) => any): this
    removeListener(event: string, listener: (...args: any[]) => any): this
    removeAllListeners(event?: string): this
    setMaxListeners(n: number): this
    getMaxListeners(): number
    listeners(event: string): Array<(...args: any[]) => any>
    emit(event: string, ...args: any[]): boolean
    listenerCount(type: string): number
    //#endregion
  }

  //#endregion

  //#region Nodes Classes

  export module Nodes {
    export class Node {
      lineno: number
      column: number
      filename: string

      first: Node
      hash: string
      nodeName: string

      constructor()

      /**
       * Return a clone of this node.
       */
      clone(): Node

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): { lineno: number; column: number; filename: string }

      /**
       * Nodes by default evaluate to themselves.
       */
      eval(): Node

      /**
       * Return true.
       */
      // tslint:disable-next-line no-unnecessary-qualifier
      toBoolean(): Nodes.Boolean

      /**
       * Return the expression, or wrap this node in an expression.
       */
      toExpression(): Expression

      /**
       * Return false if `op` is generally not coerced.
       */
      shouldCoerce(op: string): boolean

      /**
       * Operate on `right` with the given `op`.
       */
      operate(op: string, right: Node): Node

      /**
       *  Default coercion throws.
       */
      coerce(other: Node): Node
    }

    export class Root extends Node {
      nodes: Node[]

      /**
       * Push a `node` to this block.
       */
      push(node: Node): void

      /**
       * Unshift a `node` to this block.
       */
      unshift(node: Node): void

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        nodes: Node[]
        lineno: number
        column: number
        filename: string
      }
    }

    export class String extends Node {
      val: string
      string: string
      prefixed: boolean
      quote: string

      constructor(val: string)
      constructor(val: string, quote: string)

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        val: string
        quote: string
        lineno: number
        column: number
        filename: string
      }
    }

    export class Number extends Node {}

    export class Boolean extends Node {
      val: boolean
      isTrue: boolean
      isFalse: boolean

      constructor()
      constructor(val: boolean)

      /**
       * Negate the value.
       */
      // tslint:disable-next-line no-unnecessary-qualifier
      negate(): Nodes.Boolean

      /**
       * Return 'Boolean'.
       */
      inspect(): string

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        val: boolean
        lineno: number
        column: number
        filename: string
      }
    }

    export class Object extends Node {
      vals: Dictionary<Node>
      length: number

      constructor()

      /**
       * Set `key` to `val`.
       */
      set(key: string, value: Node): this

      /**
       * Get `key`.
       */
      get(key: string): Node

      /**
       * Has `key`?
       */
      has(key: string): boolean

      /**
       * Convert object to string with properties.
       */
      toBlock(): string

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        vals: Dictionary<Node>
        lineno: number
        column: number
        filename: string
      }
    }

    export class Null extends Node {
      isNull: boolean

      constructor()

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        lineno: number
        column: number
        filename: string
      }
    }

    export class Ident extends Node {
      name: string
      string: string
      val: Node
      mixin: boolean

      isEmpty: boolean

      constructor(name: string, val: Node)
      constructor(name: string, val: Node, mixin: boolean)

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        name: string
        val: Node
        mixin: boolean
        lineno: number
        column: number
        filename: string
      }
    }

    export class Literal extends Node {
      val: string
      string: string
      prefixed: boolean

      constructor(str: string)

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        string: string
        val: string
        prefixed: boolean
        lineno: number
        column: number
        filename: string
      }
    }

    export class Unit extends Node {
      val: number
      type: string

      constructor(val: number, type: string)

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        val: number
        type: string
        lineno: number
        column: number
        filename: string
      }
    }

    export class RGBA extends Node {
      r: number
      g: number
      b: number
      a: number
      rgba: RGBA
      hsla: HSLA

      constructor(r: number, g: number, b: number, a: number)

      /**
       * Return an `RGBA` without clamping values.
       */
      static withoutClamping(r: number, g: number, b: number, a: number): RGBA

      /**
       * Return a `RGBA` from the given `hsla`.
       */
      static fromHSLA(hsla: HSLA): RGBA

      /**
       * Add r,g,b,a to the current component values
       */
      add(r: number, g: number, b: number, a: number): RGBA

      /**
       * Subtract r,g,b,a from the current component values
       */
      substract(r: number, g: number, b: number, a: number): RGBA

      /**
       * Multiply rgb components by `n`.
       */
      multiply(n: number): RGBA

      /**
       * Divide rgb components by `n`.
       */
      divide(n: number): RGBA

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        r: number
        g: number
        b: number
        a: number
        lineno: number
        column: number
        filename: string
      }
    }

    export class HSLA extends Node {
      h: number
      s: number
      l: number
      a: number
      hsla: HSLA
      rgba: RGBA

      constructor(h: number, s: number, l: number, a: number)

      /**
       * Return a `HSLA` from the given `hsla`.
       */
      static fromRGBA(rgba: RGBA): HSLA

      /**
       * Add h,s,l to the current component values
       */
      add(h: number, s: number, l: number): HSLA

      /**
       * Subtract h,s,l from the current component values
       */
      substract(h: number, s: number, l: number): HSLA

      /**
       * Adjust lightness by `percent`.
       */
      adjustLightness(percent: number): HSLA

      /**
       * djust hue by `deg`.
       */
      adjustHue(deg: number): HSLA

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        h: number
        s: number
        l: number
        a: number
        lineno: number
        column: number
        filename: string
      }
    }

    export class Block extends Node {
      nodes: Node[]
      parent: Block
      node: Node
      scope: boolean

      hasProperties: boolean
      hasMedia: boolean
      isEmpty: boolean

      constructor(parent: Block)
      constructor(parent: Block, node: Node)

      /**
       * Push a `node` to this block.
       */
      push(node: Node): void

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        nodes: Node[]
        scope: boolean
        lineno: number
        column: number
        filename: string
      }
    }

    export class Group extends Node {
      nodes: Node[]
      block: Block

      hasOnlyPlaceholders: boolean

      constructor()

      /**
       * Push the given `selector` node.
       */
      push(node: Node): void

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        nodes: Node[]
        block: Block
        lineno: number
        column: number
        filename: string
      }
    }

    export class Expression extends Node {
      nodes: Node[]
      isList: boolean

      isEmpty: boolean
      first: Node

      constructor(isList: boolean)

      /**
       * Push the given node.
       */
      push(node: Node): void

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        nodes: Node[]
        isList: boolean
        lineno: number
        column: number
        filename: string
      }
    }

    export class Property extends Node {
      segments: Node[]
      expr: Expression

      constructor(segs: Node[], expr: Expression)

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        segments: Node[]
        name: string
        expr?: Expression
        literal?: Literal
        lineno: number
        column: number
        filename: string
      }
    }

    export class Each extends Node {
      val: string
      key: string
      expr: Expression
      block: Block

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        val: string
        key: string
        expr: Expression
        block: Block
        lineno: number
        column: number
        filename: string
      }
    }

    export class If extends Node {
      cond: Expression
      elses: Expression[]
      block: Block
      negate: boolean

      constructor(cond: Expression, negate: boolean)
      constructor(cond: Expression, block: Block)

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        cond: Expression
        elses: Expression[]
        block: Block
        negate: boolean
        lineno: number
        column: number
        filename: string
      }
    }

    export class Call extends Node {
      name: string
      args: Expression

      constructor(name: string, args: Expression)

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        name: string
        args: Expression
        lineno: number
        column: number
        filename: string
      }
    }

    export class UnaryOp extends Node {
      op: string
      expr: Expression

      constructor(op: string, expr: Expression)

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        op: string
        expr: Expression
        lineno: number
        column: number
        filename: string
      }
    }

    export class BinOp extends Node {
      op: string
      left: Expression
      right: Expression

      constructor(op: string, left: Expression, right: Expression)

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        op: string
        left: Expression
        right: Expression
        lineno: number
        column: number
        filename: string
      }
    }

    export class Ternary extends Node {
      op: string
      trueExpr: Expression
      falseExpr: Expression

      constructor(op: string, trueExpr: Expression, falseExpr: Expression)

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        op: string
        trueExpr: Expression
        falseExpr: Expression
        lineno: number
        column: number
        filename: string
      }
    }

    export class Return extends Node {
      expr: Expression

      constructor(expr: Expression)

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        expr: Expression
        lineno: number
        column: number
        filename: string
      }
    }

    export class Media extends Node {
      val: string

      constructor(val: string)

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        val: string
        lineno: number
        column: number
        filename: string
      }
    }

    export class QueryList extends Node {
      nodes: Node[]

      constructor()

      /**
       * Push the given `node`.
       */
      push(node: Node): void

      /**
       * Merges this query list with the `other`.
       */
      merge(other: QueryList): QueryList

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        nodes: Node[]
        lineno: number
        column: number
        filename: string
      }
    }

    export class Query extends Node {
      nodes: QueryExpr[]
      type: string
      predicate: string

      resolvedType: string
      resolvedPredicate: string

      constructor()

      /**
       * Push the given `expr`.
       */
      push(expr: QueryExpr): void

      /**
       * Merges this query with the `other`.
       */
      merge(other: Query): Query

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        nodes: QueryExpr[]
        predicate: string
        type: string
        lineno: number
        column: number
        filename: string
      }
    }

    export class QueryExpr extends Node {
      segments: Node[]
      expr: Expression

      constructor(segs: Node[])

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        segments: Node[]
        lineno: number
        column: number
        filename: string
      }
    }

    export class Params extends Node {
      nodes: Node[]

      length: number

      /**
       * Push the given `node`.
       */
      push(node: Node): void

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        nodes: Node[]
        lineno: number
        column: number
        filename: string
      }
    }

    export class Comment extends Node {
      str: string
      suppress: boolean
      inline: boolean

      constructor(str: string, suppress: boolean, inline: boolean)

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        str: string
        suppress: boolean
        inline: boolean
        lineno: number
        column: number
        filename: string
      }
    }

    export class Keyframes extends Node {
      segments: Node[]
      prefix: string

      constructor(segs: Node[])
      constructor(segs: Node[], prefix: string)

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        segments: Node[]
        prefix: string
        block: Block
        lineno: number
        column: number
        filename: string
      }
    }

    export class Member extends Node {
      left: Node
      right: Node

      constructor(left: Node, right: Node)

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        left: Node
        right: Node
        val?: string
        lineno: number
        column: number
        filename: string
      }
    }

    export class Charset extends Node {
      val: string

      constructor(val: string)

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        val: string
        lineno: number
        column: number
        filename: string
      }
    }

    export class Namespace extends Node {
      val: string
      prefix: string

      constructor(val: string, prefix: string)

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        val: string
        prefix: string
        lineno: number
        column: number
        filename: string
      }
    }

    export class Import extends Node {
      path: Expression
      once: boolean

      constructor(path: Expression)
      constructor(path: Expression, once: boolean)

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        path: Expression
        lineno: number
        column: number
        filename: string
      }
    }

    export class Extend extends Node {
      selectors: Selector[]

      constructor(selectors: Selector[])

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        selectors: Selector[]
        lineno: number
        column: number
        filename: string
      }
    }

    export class Function extends Node {
      name: string
      params: Params
      body: Block

      constructor(name: string, params: Params, body: Block)

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        name: string
        params: Params
        body: Block
        lineno: number
        column: number
        filename: string
      }
    }

    export class Selector extends Node {
      inherits: boolean
      segments: Node[]

      constructor(segs: Node[])

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        segments: Node[]
        inherits: boolean
        val: string
        lineno: number
        column: number
        filename: string
      }
    }

    export class Arguments extends Expression {
      map: Dictionary<Node>

      constructor()

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        map: Dictionary<Node>
        isList: boolean
        preserve: boolean
        nodes: Node[]
        lineno: number
        column: number
        filename: string
      }
    }

    export class Atblock extends Node {
      block: Block
      nodes: Node[]

      constructor()

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        block: Block
        lineno: number
        column: number
        filename: string
      }
    }

    export class Atrule extends Node {
      type: string

      hasOnlyProperties: boolean

      constructor(type: string)

      /**
       * Return a JSON representation of this node.
       */
      toJSON(): {
        __type: string
        type: string
        segments: Node[]
        block?: Block
        lineno: number
        column: number
        filename: string
      }
    }
  }

  //#endregion

  //#region Internal Interfaces

  export interface Dictionary<T> {
    [key: string]: T
  }

  export interface RenderOptions {
    globals?: Dictionary<any>
    functions?: Dictionary<any>
    imports?: string[]
    paths?: string[]
    filename?: string
    Evaluator?: typeof Evaluator
  }

  export type RenderCallback = (err: Error, css: string, js: string) => void

  export interface UrlOptions {
    limit?: number | false | null
    paths?: string[]
  }

  export interface LiteralFunction {
    (url: string): Nodes.Literal
    raw: boolean
  }

  export interface ExceptionOptions {
    filename: string
    context: number
    lineno: number
    column: number
    input: string
  }

  //#endregion
}
