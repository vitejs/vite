import type { ResolvedConfig } from '..'
import type { Plugin } from '../plugin'
import { isModernFlag } from './importAnalysisBuild'

export const modulePreloadPolyfillId = 'vite/modulepreload-polyfill'
const resolvedModulePreloadPolyfillId = '\0' + modulePreloadPolyfillId + '.js'

export function modulePreloadPolyfillPlugin(config: ResolvedConfig): Plugin {
  let polyfillString: string | undefined

  return {
    name: 'vite:modulepreload-polyfill',
    resolveId(id) {
      if (id === modulePreloadPolyfillId) {
        return resolvedModulePreloadPolyfillId
      }
    },
    load(id) {
      if (id === resolvedModulePreloadPolyfillId) {
        // `isModernFlag` is only available during build since it is resolved by `vite:build-import-analysis`
        if (
          config.command !== 'build' ||
          this.environment.config.consumer !== 'client'
        ) {
          return ''
        }
        if (!polyfillString) {
          polyfillString = `${isModernFlag}&&(${polyfill.toString()}());`
        }
        return { code: polyfillString, moduleSideEffects: true }
      }
    },
  }
}

/**
The following polyfill function is meant to run in the browser and adapted from
https://github.com/guybedford/es-module-shims
MIT License
Copyright (C) 2018-2021 Guy Bedford
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
*/

declare const document: any
declare const MutationObserver: any
declare const fetch: any

function polyfill() {
  const relList = document.createElement('link').relList
  if (relList && relList.supports && relList.supports('modulepreload')) {
    return
  }

  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link)
  }

  new MutationObserver((mutations: any) => {
    for (const mutation of mutations) {
      if (mutation.type !== 'childList') {
        continue
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === 'LINK' && node.rel === 'modulepreload')
          processPreload(node)
      }
    }
  }).observe(document, { childList: true, subtree: true })

  function getFetchOpts(link: any) {
    const fetchOpts = {} as any
    if (link.integrity) fetchOpts.integrity = link.integrity
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy
    if (link.crossOrigin === 'use-credentials')
      fetchOpts.credentials = 'include'
    else if (link.crossOrigin === 'anonymous') fetchOpts.credentials = 'omit'
    else fetchOpts.credentials = 'same-origin'
    return fetchOpts
  }

  function processPreload(link: any) {
    if (link.ep)
      // ep marker = processed
      return
    link.ep = true
    // prepopulate the load record
    const fetchOpts = getFetchOpts(link)
    fetch(link.href, fetchOpts)
  }
}
