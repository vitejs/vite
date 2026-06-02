// https://gist.github.com/samthor/64b114e4a4f539915a95b91ffd340acc
// DO NOT ALTER THIS CONTENT
export const safari10NoModuleFix: string = `!function(){var e=document,t=e.createElement("script");if(!("noModule"in t)&&"onbeforeload"in t){var n=!1;e.addEventListener("beforeload",(function(e){if(e.target===t)n=!0;else if(!e.target.hasAttribute("nomodule")||!n)return;e.preventDefault()}),!0),t.type="module",t.src=".",e.head.appendChild(t),t.remove()}}();`

export const legacyPolyfillId: string = 'vite-legacy-polyfill'
export const legacyEntryId: string = 'vite-legacy-entry'
export const systemJSInlineCode: string = `System.import(document.getElementById('${legacyEntryId}').getAttribute('data-src'))`

const detectModernBrowserVarName = '__vite_is_modern_browser'

/**
 * Create an inline module to detect if the browser supports import.meta.resolve
 *
 * This is an inline module to execute the code before other imports.
 * Throwing an error can prevent the browser from executing the rest of the code.
 *
 * Note that due to a bug in Safari 15.x and below, each inline module has to be unique,
 * otherwise Safari will only throw the error for the first time that module is imported.
 * https://github.com/vitejs/vite/issues/22008
 */
const createDetectImportMetaResolveSupportModule = (chunkId: string | null) =>
  `data:text/javascript,${chunkId != null ? `${JSON.stringify(chunkId)};` : ''}if(!import.meta.resolve)throw Error("import.meta.resolve not supported")`

export const detectModernBrowserDetector: string = `import.meta.url;import("_").catch(()=>1);(async function*(){})().next()`
export const detectModernBrowserCode: string = `import'${createDetectImportMetaResolveSupportModule(null)}';${detectModernBrowserDetector};window.${detectModernBrowserVarName}=true`
export const dynamicFallbackInlineCode: string = `!function(){if(window.${detectModernBrowserVarName})return;console.warn("vite: loading legacy chunks, syntax error above and the same error below should be ignored");var e=document.getElementById("${legacyPolyfillId}"),n=document.createElement("script");n.src=e.src,n.onload=function(){${systemJSInlineCode}},document.body.appendChild(n)}();`

export const createModernChunkLegacyGuard = (chunkId: string): string =>
  `import'${createDetectImportMetaResolveSupportModule(chunkId)}';export function __vite_legacy_guard(){${detectModernBrowserDetector}};`
