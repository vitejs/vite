export const CSP_NONCE_META_PROPERTIES = {
  shared: 'csp-nonce',
  script: 'csp-script-nonce',
  style: 'csp-style-nonce',
} as const

export type CSPNonceProperty =
  (typeof CSP_NONCE_META_PROPERTIES)[keyof typeof CSP_NONCE_META_PROPERTIES]

export type ResolvedCSPNonce = {
  script: string | undefined
  style: string | undefined
}

export type ReadCSPNonce = (property: CSPNonceProperty) => string | undefined

const readCspNonceFromMeta: ReadCSPNonce = (property) => {
  const meta = document.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`,
  )
  if (!meta?.hasAttribute('nonce')) return undefined
  // `.nonce` should be used to get along with nonce hiding (https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce#accessing_nonces_and_nonce_hiding)
  // Firefox 67-74 uses modern chunks and supports CSP nonce, but does not support `.nonce`
  // in that case fallback to getAttribute
  return meta?.nonce || meta?.getAttribute('nonce') || undefined
}

export const resolveCspNonceFromDocument = (): ResolvedCSPNonce => {
  const shared = readCspNonceFromMeta(CSP_NONCE_META_PROPERTIES.shared)
  return {
    script: readCspNonceFromMeta(CSP_NONCE_META_PROPERTIES.script) || shared,
    style: readCspNonceFromMeta(CSP_NONCE_META_PROPERTIES.style) || shared,
  }
}
