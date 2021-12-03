// https://gist.github.com/samthor/64b114e4a4f539915a95b91ffd340acc
// DO NOT ALTER THIS CONTENT
const safari10NoModuleFix = `!function(){var e=document,t=e.createElement("script");if(!("noModule"in t)&&"onbeforeload"in t){var n=!1;e.addEventListener("beforeload",(function(e){if(e.target===t)n=!0;else if(!e.target.hasAttribute("nomodule")||!n)return;e.preventDefault()}),!0),t.type="module",t.src=".",e.head.appendChild(t),t.remove()}}();`

const legacyPolyfillId = 'vite-legacy-polyfill'
const legacyEntryId = 'vite-legacy-entry'
const systemJSInlineCode = `System.import(document.getElementById('${legacyEntryId}').getAttribute('data-src'))`
const dynamicFallbackInlineCode = `!function(){try{new Function("m","return import(m)")}catch(o){console.warn("vite: loading legacy build because dynamic import is unsupported, syntax error above should be ignored");var e=document.getElementById("${legacyPolyfillId}"),n=document.createElement("script");n.src=e.src,n.onload=function(){${systemJSInlineCode}},document.body.appendChild(n)}}();`

module.exports = {
  dynamicFallbackInlineCode,
  safari10NoModuleFix,
  legacyPolyfillId,
  legacyEntryId,
  systemJSInlineCode
}
