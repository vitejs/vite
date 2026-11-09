/**
 * The following is modified based on source found in
 * https://github.com/jshttp/etag
 *
 * MIT Licensed
 * Copyright (c) 2014-2016 Douglas Christopher Wilson
 * https://github.com/jshttp/etag/blob/master/LICENSE
 *
 * The `fs.Stats` support from the original implementation is removed
 * as Vite only generates etags for strings and buffers.
 */

import { hash } from 'node:crypto'

// the SHA-1 hash of an empty entity, base64 encoded and truncated to 27 chars
const emptyEntityTag = '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"'

export function getEtag(
  entity: string | Buffer,
  options?: { weak?: boolean },
): string {
  let tag: string
  if (entity.length === 0) {
    // fast-path empty entity
    tag = emptyEntityTag
  } else {
    const digest = hash('sha1', entity, 'base64').substring(0, 27)
    const length =
      typeof entity === 'string'
        ? Buffer.byteLength(entity, 'utf8')
        : entity.length
    tag = `"${length.toString(16)}-${digest}"`
  }

  return options?.weak ? `W/${tag}` : tag
}
