// https://gist.github.com/samthor/64b114e4a4f539915a95b91ffd340acc
// DO NOT ALTER THIS CONTENT
export const safari10NoModuleFix = `!function(){var e=document,t=e.createElement("script");if(!("noModule"in t)&&"onbeforeload"in t){var n=!1;e.addEventListener("beforeload",(function(e){if(e.target===t)n=!0;else if(!e.target.hasAttribute("nomodule")||!n)return;e.preventDefault()}),!0),t.type="module",t.src=".",e.head.appendChild(t),t.remove()}}();`

export const legacyPolyfillId = 'vite-legacy-polyfill'
export const legacyEntryId = 'vite-legacy-entry'
export const systemJSInlineCode = `System.import(document.getElementById('${legacyEntryId}').getAttribute('data-src'))`

const detectModernBrowserVarName = '__vite_is_modern_browser'
export const detectModernBrowserDetector =
  'import.meta.url;import("_").catch(()=>1);(async function* g(){})();'
export const detectModernBrowserCode = `${detectModernBrowserDetector}if(location.protocol!="file:"){window.${detectModernBrowserVarName}=true}`
export const dynamicFallbackInlineCode = `!function(){if(window.${detectModernBrowserVarName})return;console.warn("vite: loading legacy chunks, syntax error above and the same error below should be ignored");var e=document.getElementById("${legacyPolyfillId}"),n=document.createElement("script");n.src=e.src,n.onload=function(){${systemJSInlineCode}},document.body.appendChild(n)}();`

export const modernChunkLegacyGuard = `export function __vite_legacy_guard(){${detectModernBrowserDetector}};`
