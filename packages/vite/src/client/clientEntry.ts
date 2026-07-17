// entry for `client.mjs` (middleware mode). `client.ts` exports extra internal
// bindings (`transport`, `registerFbmClient`, ...) so the full-bundle-mode
// entry can reuse them; this wrapper keeps them out of `/@vite/client`'s
// public API.
export {
  createHotContext,
  injectQuery,
  removeStyle,
  updateStyle,
  ErrorOverlay,
} from './client'
