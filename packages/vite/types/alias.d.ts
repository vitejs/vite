/**
Types from https://github.com/rollup/plugins/blob/master/packages/alias/types/index.d.ts
Inlined because the plugin is bundled.

https://github.com/rollup/plugins/blob/master/LICENSE

The MIT License (MIT)

Copyright (c) 2019 RollupJS Plugin Contributors (https://github.com/rollup/plugins/graphs/contributors)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

import { PluginHooks } from 'rollup'

export interface Alias {
  find: string | RegExp
  replacement: string
  customResolver?: ResolverFunction | ResolverObject | null
}

export type ResolverFunction = PluginHooks['resolveId']

export interface ResolverObject {
  buildStart?: PluginHooks['buildStart']
  resolveId: ResolverFunction
}

export interface AliasOptions {
  /**
   * Instructs the plugin to use an alternative resolving algorithm,
   * rather than the Rollup's resolver.
   * @default null
   */
  customResolver?: ResolverFunction | ResolverObject | null

  /**
   * Specifies an `Object`, or an `Array` of `Object`,
   * which defines aliases used to replace values in `import` or `require` statements.
   * With either format, the order of the entries is important,
   * in that the first defined rules are applied first.
   */
  entries?: readonly Alias[] | { [find: string]: string }
}
