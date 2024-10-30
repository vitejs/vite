import { describe, expect, test } from 'vitest'
import { type DefaultTreeAdapterMap, parseFragment } from 'parse5'
import { getNodeAssetAttributes } from '../assetSource'

describe('getNodeAssetAttributes', () => {
  const getNode = (html: string) => {
    const ast = parseFragment(html, { sourceCodeLocationInfo: true })
    return ast.childNodes[0] as DefaultTreeAdapterMap['element']
  }

  test('handles img src', () => {
    const node = getNode('<img src="foo.jpg">')
    const attrs = getNodeAssetAttributes(node)
    expect(attrs).toHaveLength(1)
    expect(attrs[0]).toHaveProperty('type', 'src')
    expect(attrs[0]).toHaveProperty('key', 'src')
    expect(attrs[0]).toHaveProperty('value', 'foo.jpg')
    expect(attrs[0].attributes).toEqual({ src: 'foo.jpg' })
    expect(attrs[0].location).toHaveProperty('startOffset', 5)
    expect(attrs[0].location).toHaveProperty('endOffset', 18)
  })

  test('handles source srcset', () => {
    const node = getNode('<source srcset="foo.jpg 1x, bar.jpg 2x">')
    const attrs = getNodeAssetAttributes(node)
    expect(attrs).toHaveLength(1)
    expect(attrs[0]).toHaveProperty('type', 'srcset')
    expect(attrs[0]).toHaveProperty('key', 'srcset')
    expect(attrs[0]).toHaveProperty('value', 'foo.jpg 1x, bar.jpg 2x')
    expect(attrs[0].attributes).toEqual({ srcset: 'foo.jpg 1x, bar.jpg 2x' })
  })

  test('handles video src and poster', () => {
    const node = getNode('<video src="video.mp4" poster="poster.jpg">')
    const attrs = getNodeAssetAttributes(node)
    expect(attrs).toHaveLength(2)
    expect(attrs[0]).toHaveProperty('type', 'src')
    expect(attrs[0]).toHaveProperty('key', 'src')
    expect(attrs[0]).toHaveProperty('value', 'video.mp4')
    expect(attrs[0].attributes).toEqual({
      src: 'video.mp4',
      poster: 'poster.jpg',
    })
    expect(attrs[1]).toHaveProperty('type', 'src')
    expect(attrs[1]).toHaveProperty('key', 'poster')
    expect(attrs[1]).toHaveProperty('value', 'poster.jpg')
  })

  test('handles link with allowed rel', () => {
    const node = getNode('<link rel="stylesheet" href="style.css">')
    const attrs = getNodeAssetAttributes(node)
    expect(attrs).toHaveLength(1)
    expect(attrs[0]).toHaveProperty('type', 'src')
    expect(attrs[0]).toHaveProperty('key', 'href')
    expect(attrs[0]).toHaveProperty('value', 'style.css')
    expect(attrs[0].attributes).toEqual({
      rel: 'stylesheet',
      href: 'style.css',
    })
  })

  test('handles meta with allowed name', () => {
    const node = getNode('<meta name="twitter:image" content="image.jpg">')
    const attrs = getNodeAssetAttributes(node)
    expect(attrs).toHaveLength(1)
    expect(attrs[0]).toHaveProperty('type', 'src')
    expect(attrs[0]).toHaveProperty('key', 'content')
    expect(attrs[0]).toHaveProperty('value', 'image.jpg')
  })

  test('handles meta with allowed property', () => {
    const node = getNode('<meta property="og:image" content="image.jpg">')
    const attrs = getNodeAssetAttributes(node)
    expect(attrs).toHaveLength(1)
    expect(attrs[0]).toHaveProperty('type', 'src')
    expect(attrs[0]).toHaveProperty('key', 'content')
    expect(attrs[0]).toHaveProperty('value', 'image.jpg')
  })

  test('does not handle meta with unknown name', () => {
    const node = getNode('<meta name="unknown" content="image.jpg">')
    const attrs = getNodeAssetAttributes(node)
    expect(attrs).toHaveLength(0)
  })

  test('does not handle meta with unknown property', () => {
    const node = getNode('<meta property="unknown" content="image.jpg">')
    const attrs = getNodeAssetAttributes(node)
    expect(attrs).toHaveLength(0)
  })

  test('does not handle meta with no known properties', () => {
    const node = getNode('<meta foo="bar" content="image.jpg">')
    const attrs = getNodeAssetAttributes(node)
    expect(attrs).toHaveLength(0)
  })
})
