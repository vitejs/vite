**Problem**: 
When `server.origin` contains an IPv6 address, Vite percent-encodes the square brackets when generating URLs for `?url` imports. Since the brackets are part of the IPv6 host, they should remain literal instead of being percent-escaped. As a result, browsers like Firefox correctly reject the generated value during `fetch()` because `%5B::1%5D` is an invalid hostname, leading to `TypeError: Window.fetch: http://%5B::1%5D:5173/... is not a valid URL.` This primarily breaks loading of external assets (e.g. WASM or web workers) when the `server.origin` is explicitly set to an IPv6 literal (e.g. `http://[::1]:5173`).

**Solution**:
The problem occurs in `encodeURIPath` where we use `encodeURI(filePath)`. The standard ECMAScript `encodeURI` percent-encodes square brackets (`[` and `]`). Since we use this function to encode the final generated asset URLs, any valid IPv6 bracket characters in the host origin inadvertently become escaped.

The solution ensures we preserve literal brackets `[` and `]` but ONLY within the host part of the URL (i.e., `http://[::1]`). We do this by applying a regex to the encoded URI that only targets the `<protocol>://<host>` substring and safely un-encodes `%5B` and `%5D` back to `[` and `]`, while leaving any encoded brackets in the pathname intact. This surgical approach maintains the percent-encoding for file paths that genuinely contain square brackets.

**Changes Made**:
- Modified `encodeURIPath` in `packages/vite/src/node/utils.ts` to replace `%5B` and `%5D` back into literal `[` and `]` characters exclusively within the host protocol portion of the URI string.
- Added tests in `packages/vite/src/node/__tests__/utils.spec.ts` for `encodeURIPath` to verify it correctly encodes file paths, while strictly ignoring brackets in the host component of the IPv6 address.

**Testing**:
To reproduce:
1. Initialize a minimal Vite project with an asset `import assetUrl from './assets/vite.svg?url'`.
2. Configure `vite.config.js` with `server: { origin: 'http://[::1]:5173' }`.
3. Try fetching `assetUrl` from the application in Firefox; observe `TypeError` due to invalid URL structure.

With this fix, the tests are fully green (`pnpm test-unit utils`), ensuring backwards compatibility while the origin correctly remains `http://[::1]:5173` upon usage.

Fixes #23108
