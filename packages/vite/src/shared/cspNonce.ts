export type CSPNonceDestination = 'script' | 'style'

export type CSPNonceMetaProperty =
  | `csp-${CSPNonceDestination}-nonce`
  | 'csp-nonce'

// NOTE: inlined into user bundles via `toString()`, so it must not reference
// anything outside its own body — that compiles here but throws a
// `ReferenceError` in the generated chunk.
export function readCspNonce(
  destination: CSPNonceDestination,
): string | undefined {
  const read = (property: string) => {
    const meta = document.querySelector<HTMLMetaElement>(
      `meta[property="${property}"]`,
    )
    // `.nonce` should be used to get along with nonce hiding (https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce#accessing_nonces_and_nonce_hiding)
    // Firefox 67-74 uses modern chunks and supports CSP nonce, but does not support `.nonce`
    // in that case fallback to getAttribute
    return meta?.nonce || meta?.getAttribute('nonce') || undefined
  }
  return read(`csp-${destination}-nonce`) || read('csp-nonce')
}
