import type { DefaultTreeAdapterMap, Token } from 'parse5'

// Asset list is derived from https://github.com/webpack-contrib/html-loader
// MIT license: https://github.com/webpack-contrib/html-loader/blob/master/LICENSE

interface HtmlAssetSource {
  srcAttributes?: string[]
  srcsetAttributes?: string[]
  /**
   * Called before handling an attribute to determine if it should be processed.
   */
  filter?: (data: HtmlAssetSourceFilterData) => boolean
}

interface HtmlAssetSourceFilterData {
  attribute: string
  value: string
  attributes: Record<string, string>
}

interface AssetAttribute {
  attribute: Token.Attribute
  type: 'src' | 'srcset'
  location: Token.Location
}

export function getNodeAssetAttributes(
  node: DefaultTreeAdapterMap['element'],
): AssetAttribute[] {
  const assetAttrs: AssetAttribute[] = []

  for (const assetSource of DEFAULT_HTML_ASSET_SOURCES) {
    if (assetSource.tag !== node.nodeName) continue

    const attributes = node.attrs.reduce(
      (acc, attr) => {
        acc[getAttrKey(attr)] = attr.value
        return acc
      },
      {} as Record<string, string>,
    )

    const attrNames = Object.keys(attributes)

    for (let i = 0; i < node.attrs.length; i++) {
      const attr = node.attrs[i]

      if (
        attr.value &&
        assetSource.attributes.includes(attrNames[i]) &&
        (!assetSource.filter ||
          assetSource.filter({
            attribute: attrNames[i],
            value: attr.value,
            attributes,
          }))
      ) {
        assetAttrs.push({
          attribute: attr,
          type: assetSource.type,
          location: node.sourceCodeLocation!.attrs![attrNames[i]],
        })
      }
    }
  }

  return assetAttrs
}

function getAttrKey(attr: Token.Attribute): string {
  return attr.prefix === undefined ? attr.name : `${attr.prefix}:${attr.name}`
}

const ALLOWED_REL = [
  'stylesheet',
  'icon',
  'shortcut icon',
  'mask-icon',
  'apple-touch-icon',
  'apple-touch-icon-precomposed',
  'apple-touch-startup-image',
  'manifest',
  'prefetch',
  'preload',
]

const ALLOWED_ITEMPROP = [
  'image',
  'logo',
  'screenshot',
  'thumbnailurl',
  'contenturl',
  'downloadurl',
  'duringmedia',
  'embedurl',
  'installurl',
  'layoutimage',
]

const ALLOWED_META_NAME = [
  'msapplication-tileimage',
  'msapplication-square70x70logo',
  'msapplication-square150x150logo',
  'msapplication-wide310x150logo',
  'msapplication-square310x310logo',
  'msapplication-config',
  'twitter:image',
]

const ALLOWED_META_PROPERTY = [
  'og:image',
  'og:image:url',
  'og:image:secure_url',
  'og:audio',
  'og:audio:secure_url',
  'og:video',
  'og:video:secure_url',
  'vk:image',
]

export const DEFAULT_HTML_ASSET_SOURCES: Record<string, HtmlAssetSource> = {
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
  input: {
    srcAttributes: ['src'],
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
  video: {
    srcAttributes: ['src', 'poster'],
  },
  image: {
    srcAttributes: ['href', 'xlink:href'],
  },
  use: {
    srcAttributes: ['href', 'xlink:href'],
  },
  link: {
    srcAttributes: ['href'],
    srcsetAttributes: ['imagesrcset'],
    filter({ attribute, attributes }) {
      if (
        attributes.rel &&
        ALLOWED_REL.includes(attributes.rel.trim().toLowerCase())
      ) {
        return true
      }

      if (
        attribute === 'href' &&
        attributes.itemprop &&
        ALLOWED_ITEMPROP.includes(attributes.itemprop.trim().toLowerCase())
      ) {
        return true
      }

      return false
    },
  },
  meta: {
    srcAttributes: ['content'],
    filter({ attribute, attributes }) {
      if (
        attribute === 'content' &&
        attributes.name &&
        ALLOWED_META_NAME.includes(attributes.name.trim().toLowerCase())
      ) {
        return true
      }

      if (
        attribute === 'content' &&
        attributes.property &&
        ALLOWED_META_PROPERTY.includes(attributes.property.trim().toLowerCase())
      ) {
        return true
      }

      if (
        attribute === 'content' &&
        attributes.itemprop &&
        ALLOWED_ITEMPROP.includes(attributes.itemprop.trim().toLowerCase())
      ) {
        return true
      }

      return false
    },
  },
}
