// Modified and inlined to avoid extra dependency
// Source: https://github.com/terser/terser/blob/master/tools/terser.d.ts
// BSD Licensed https://github.com/terser/terser/blob/master/LICENSE

/*
Terser is released under the BSD license:

Copyright 2012-2018 (c) Mihai Bazon <mihai.bazon@gmail.com>

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:

    * Redistributions of source code must retain the above
      copyright notice, this list of conditions and the following
      disclaimer.

    * Redistributions in binary form must reproduce the above
      copyright notice, this list of conditions and the following
      disclaimer in the documentation and/or other materials
      provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
SUCH DAMAGE.
*/

export namespace Terser {
  export type ECMA = 5 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020

  export interface ParseOptions {
    bare_returns?: boolean
    ecma?: ECMA
    html5_comments?: boolean
    shebang?: boolean
  }

  export interface CompressOptions {
    arguments?: boolean
    arrows?: boolean
    booleans_as_integers?: boolean
    booleans?: boolean
    collapse_vars?: boolean
    comparisons?: boolean
    computed_props?: boolean
    conditionals?: boolean
    dead_code?: boolean
    defaults?: boolean
    directives?: boolean
    drop_console?: boolean
    drop_debugger?: boolean
    ecma?: ECMA
    evaluate?: boolean
    expression?: boolean
    global_defs?: object
    hoist_funs?: boolean
    hoist_props?: boolean
    hoist_vars?: boolean
    ie8?: boolean
    if_return?: boolean
    inline?: boolean | InlineFunctions
    join_vars?: boolean
    keep_classnames?: boolean | RegExp
    keep_fargs?: boolean
    keep_fnames?: boolean | RegExp
    keep_infinity?: boolean
    loops?: boolean
    module?: boolean
    negate_iife?: boolean
    passes?: number
    properties?: boolean
    pure_funcs?: string[]
    pure_getters?: boolean | 'strict'
    reduce_funcs?: boolean
    reduce_vars?: boolean
    sequences?: boolean | number
    side_effects?: boolean
    switches?: boolean
    toplevel?: boolean
    top_retain?: null | string | string[] | RegExp
    typeofs?: boolean
    unsafe_arrows?: boolean
    unsafe?: boolean
    unsafe_comps?: boolean
    unsafe_Function?: boolean
    unsafe_math?: boolean
    unsafe_symbols?: boolean
    unsafe_methods?: boolean
    unsafe_proto?: boolean
    unsafe_regexp?: boolean
    unsafe_undefined?: boolean
    unused?: boolean
  }

  export enum InlineFunctions {
    Disabled = 0,
    SimpleFunctions = 1,
    WithArguments = 2,
    WithArgumentsAndVariables = 3
  }

  export interface MangleOptions {
    eval?: boolean
    keep_classnames?: boolean | RegExp
    keep_fnames?: boolean | RegExp
    module?: boolean
    properties?: boolean | ManglePropertiesOptions
    reserved?: string[]
    safari10?: boolean
    toplevel?: boolean
  }

  export interface ManglePropertiesOptions {
    builtins?: boolean
    debug?: boolean
    keep_quoted?: boolean | 'strict'
    regex?: RegExp | string
    reserved?: string[]
  }

  export interface FormatOptions {
    ascii_only?: boolean
    beautify?: boolean
    braces?: boolean
    comments?:
      | boolean
      | 'all'
      | 'some'
      | RegExp
      | ((
          node: any,
          comment: {
            value: string
            type: 'comment1' | 'comment2' | 'comment3' | 'comment4'
            pos: number
            line: number
            col: number
          }
        ) => boolean)
    ecma?: ECMA
    ie8?: boolean
    indent_level?: number
    indent_start?: number
    inline_script?: boolean
    keep_quoted_props?: boolean
    max_line_len?: number | false
    preamble?: string
    preserve_annotations?: boolean
    quote_keys?: boolean
    quote_style?: OutputQuoteStyle
    safari10?: boolean
    semicolons?: boolean
    shebang?: boolean
    shorthand?: boolean
    source_map?: SourceMapOptions
    webkit?: boolean
    width?: number
    wrap_iife?: boolean
    wrap_func_args?: boolean
  }

  export enum OutputQuoteStyle {
    PreferDouble = 0,
    AlwaysSingle = 1,
    AlwaysDouble = 2,
    AlwaysOriginal = 3
  }

  export interface MinifyOptions {
    compress?: boolean | CompressOptions
    ecma?: ECMA
    ie8?: boolean
    keep_classnames?: boolean | RegExp
    keep_fnames?: boolean | RegExp
    mangle?: boolean | MangleOptions
    module?: boolean
    nameCache?: object
    format?: FormatOptions
    parse?: ParseOptions
    safari10?: boolean
    sourceMap?: boolean | SourceMapOptions
    toplevel?: boolean
  }

  export interface MinifyOutput {
    code?: string
    map?: object | string
  }

  export interface SourceMapOptions {
    /** Source map object, 'inline' or source map file content */
    content?: object | string
    includeSources?: boolean
    filename?: string
    root?: string
    url?: string | 'inline'
  }
}
