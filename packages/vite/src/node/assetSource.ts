import type { DefaultTreeAdapterMap, Token } from 'parse5'

interface HtmlAssetSource {
  srcAttributes?: string[]
  srcsetAttributes?: string[]
  /**
   * Called before handling an attribute to determine if it should be processed.
   */
  filter?: (data: HtmlAssetSourceFilterData) => boolean
}

interface HtmlAssetSourceFilterData {
  key: string
  value: string
  attributes: Record<string, string>
}

// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta/name
// https://wiki.whatwg.org/wiki/MetaExtensions
const ALLOWED_META_NAME = [
  'msapplication-tileimage',
  'msapplication-square70x70logo',
  'msapplication-square150x150logo',
  'msapplication-wide310x150logo',
  'msapplication-square310x310logo',
  'msapplication-config',
  'twitter:image',
]

// https://ogp.me
const ALLOWED_META_PROPERTY = [
  'og:image',
  'og:image:url',
  'og:image:secure_url',
  'og:audio',
  'og:audio:secure_url',
  'og:video',
  'og:video:secure_url',
]

const DEFAULT_HTML_ASSET_SOURCES: Record<string, HtmlAssetSource> = {
  audio: {
    srcAttributes: ['src'],
  },
  embed: {
    srcAttributes: ['src'],
  },
  img: {
    srcAttributes: ['src'],
    srcsetAttributes: ['srcset'],
  },
  image: {
    srcAttributes: ['href', 'xlink:href'],
  },
  input: {
    srcAttributes: ['src'],
  },
  link: {
    srcAttributes: ['href'],
    srcsetAttributes: ['imagesrcset'],
  },
  object: {
    srcAttributes: ['data'],
  },
  source: {
    srcAttributes: ['src'],
    srcsetAttributes: ['srcset'],
  },
  track: {
    srcAttributes: ['src'],
  },
  use: {
    srcAttributes: ['href', 'xlink:href'],
  },
  video: {
    srcAttributes: ['src', 'poster'],
  },
  meta: {
    srcAttributes: ['content'],
    filter({ attributes }) {
      if (
        attributes.name &&
        ALLOWED_META_NAME.includes(attributes.name.trim().toLowerCase())
      ) {
        return true
      }

      if (
        attributes.property &&
        ALLOWED_META_PROPERTY.includes(attributes.property.trim().toLowerCase())
      ) {
        return true
      }

      return false
    },
  },
}

interface HtmlAssetAttribute {
  type: 'src' | 'srcset' | 'remove'
  key: string
  value: string
  attributes: Record<string, string>
  location: Token.Location
}

/**
 * Given a HTML node, find all attributes that references an asset to be processed
 */
export function getNodeAssetAttributes(
  node: DefaultTreeAdapterMap['element'],
): HtmlAssetAttribute[] {
  const matched = DEFAULT_HTML_ASSET_SOURCES[node.nodeName]
  if (!matched) return []

  const attributes: Record<string, string> = {}
  for (const attr of node.attrs) {
    attributes[getAttrKey(attr)] = attr.value
  }

  // If the node has a `vite-ignore` attribute, remove the attribute and early out
  // to skip processing any attributes
  if ('vite-ignore' in attributes) {
    return [
      {
        type: 'remove',
        key: 'vite-ignore',
        value: '',
        attributes,
        location: node.sourceCodeLocation!.attrs!['vite-ignore'],
      },
    ]
  }

  const actions: HtmlAssetAttribute[] = []
  function handleAttributeKey(key: string, type: 'src' | 'srcset') {
    const value = attributes[key]
    if (!value) return
    if (matched.filter && !matched.filter({ key, value, attributes })) return
    const location = node.sourceCodeLocation!.attrs![key]
    actions.push({ type, key, value, attributes, location })
  }
  matched.srcAttributes?.forEach((key) => handleAttributeKey(key, 'src'))
  matched.srcsetAttributes?.forEach((key) => handleAttributeKey(key, 'srcset'))
  return actions
}

function getAttrKey(attr: Token.Attribute): string {
  return attr.prefix === undefined ? attr.name : `${attr.prefix}:${attr.name}`
}
