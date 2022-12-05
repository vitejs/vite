import type { DefaultTreeAdapterMap, Token } from 'parse5'

interface HtmlAssetSource {
  tag: string
  attributes: string[]
  type: 'src' | 'srcset'
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
  node: DefaultTreeAdapterMap['element']
): AssetAttribute[] {
  const assetAttrs: AssetAttribute[] = []

  for (const assetSource of DEFAULT_HTML_ASSET_SOURCES) {
    if (assetSource.tag !== node.nodeName) continue

    const attributes = node.attrs.reduce((acc, attr) => {
      acc[getAttrKey(attr)] = attr.value
      return acc
    }, {} as Record<string, string>)

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
            attributes
          }))
      ) {
        assetAttrs.push({
          attribute: attr,
          type: assetSource.type,
          location: node.sourceCodeLocation!.attrs![attrNames[i]]
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
  'preload'
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
  'layoutimage'
]

const ALLOWED_META_NAME = [
  'msapplication-tileimage',
  'msapplication-square70x70logo',
  'msapplication-square150x150logo',
  'msapplication-wide310x150logo',
  'msapplication-square310x310logo',
  'msapplication-config',
  'twitter:image'
]

const ALLOWED_META_PROPERTY = [
  'og:image',
  'og:image:url',
  'og:image:secure_url',
  'og:audio',
  'og:audio:secure_url',
  'og:video',
  'og:video:secure_url',
  'vk:image'
]

const DEFAULT_HTML_ASSET_SOURCES: HtmlAssetSource[] = [
  {
    tag: 'audio',
    type: 'src',
    attributes: ['src']
  },
  {
    tag: 'embed',
    type: 'src',
    attributes: ['src']
  },
  {
    tag: 'img',
    type: 'src',
    attributes: ['src']
  },
  {
    tag: 'img',
    type: 'srcset',
    attributes: ['srcset']
  },
  {
    tag: 'input',
    type: 'src',
    attributes: ['src']
  },
  {
    tag: 'object',
    type: 'src',
    attributes: ['data']
  },
  {
    tag: 'source',
    type: 'src',
    attributes: ['src']
  },
  {
    tag: 'source',
    type: 'srcset',
    attributes: ['srcset']
  },
  {
    tag: 'track',
    type: 'src',
    attributes: ['src']
  },
  {
    tag: 'video',
    type: 'src',
    attributes: ['poster', 'src']
  },
  {
    tag: 'image',
    type: 'src',
    attributes: ['href', 'xlink:href']
  },
  {
    tag: 'use',
    type: 'src',
    attributes: ['href', 'xlink:href']
  },
  {
    tag: 'link',
    type: 'src',
    attributes: ['href'],
    filter({ attributes }) {
      if (attributes.rel && ALLOWED_REL.includes(attributes.rel)) {
        return true
      }

      if (
        attributes.itemprop &&
        ALLOWED_ITEMPROP.includes(attributes.itemprop)
      ) {
        return true
      }

      return false
    }
  },
  {
    tag: 'link',
    type: 'srcset',
    attributes: ['imagesrcset'],
    filter({ attributes }) {
      if (attributes.rel && ALLOWED_REL.includes(attributes.rel)) {
        return true
      }

      return false
    }
  },
  {
    tag: 'meta',
    type: 'src',
    attributes: ['content'],
    filter({ attributes }) {
      if (attributes.name && ALLOWED_META_NAME.includes(attributes.name)) {
        return true
      }

      if (
        attributes.property &&
        ALLOWED_META_PROPERTY.includes(attributes.property)
      ) {
        return true
      }

      if (
        attributes.itemprop &&
        ALLOWED_ITEMPROP.includes(attributes.itemprop)
      ) {
        return true
      }

      return false
    }
  }
]
