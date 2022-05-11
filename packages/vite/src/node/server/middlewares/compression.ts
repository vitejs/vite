//@ts-nocheck
/* eslint-disable */
//TODO: replace this code with https://github.com/lukeed/polka/pull/148 once it's released

// This is based on https://github.com/preactjs/wmr/blob/main/packages/wmr/src/lib/polkompress.js
// MIT Licensed https://github.com/preactjs/wmr/blob/main/LICENSE
import zlib from 'zlib'

/* global Buffer */

const noop = () => {}

const mimes = /text|javascript|\/json|xml/i
const threshold = 1024
const level = -1
let brotli = false
const gzip = true

const getChunkSize = (chunk, enc) => (chunk ? Buffer.byteLength(chunk, enc) : 0)

export default function compression() {
  const brotliOpts = (typeof brotli === 'object' && brotli) || {}
  const gzipOpts = (typeof gzip === 'object' && gzip) || {}

  // disable Brotli on Node<12.7 where it is unsupported:
  if (!zlib.createBrotliCompress) brotli = false

  return (req, res, next = noop) => {
    const accept = req.headers['accept-encoding'] + ''
    const encoding = ((brotli && accept.match(/\bbr\b/)) ||
      (gzip && accept.match(/\bgzip\b/)) ||
      [])[0]

    // skip if no response body or no supported encoding:
    if (req.method === 'HEAD' || !encoding) return next()

    /** @type {zlib.Gzip | zlib.BrotliCompress} */
    let compress
    let pendingStatus
    /** @type {[string, function][]?} */
    let pendingListeners = []
    let started = false
    let size = 0

    function start() {
      started = true
      // @ts-ignore
      size = res.getHeader('Content-Length') | 0 || size
      const compressible = mimes.test(
        String(res.getHeader('Content-Type') || 'text/plain')
      )
      const cleartext = !res.getHeader('Content-Encoding')
      const listeners = pendingListeners || []
      if (compressible && cleartext && size >= threshold) {
        res.setHeader('Content-Encoding', encoding)
        res.removeHeader('Content-Length')
        if (encoding === 'br') {
          const params = {
            [zlib.constants.BROTLI_PARAM_QUALITY]: level,
            [zlib.constants.BROTLI_PARAM_SIZE_HINT]: size
          }
          compress = zlib.createBrotliCompress({
            params: Object.assign(params, brotliOpts)
          })
        } else {
          compress = zlib.createGzip(Object.assign({ level }, gzipOpts))
        }
        // backpressure
        compress.on(
          'data',
          (chunk) => write.call(res, chunk) === false && compress.pause()
        )
        on.call(res, 'drain', () => compress.resume())
        compress.on('end', () => end.call(res))
        listeners.forEach((p) => compress.on.apply(compress, p))
      } else {
        pendingListeners = null
        listeners.forEach((p) => on.apply(res, p))
      }

      writeHead.call(res, pendingStatus || res.statusCode)
    }

    const { end, write, on, writeHead } = res

    res.writeHead = function (status, reason, headers) {
      if (typeof reason !== 'string') [headers, reason] = [reason, headers]
      if (headers) for (let i in headers) res.setHeader(i, headers[i])
      pendingStatus = status
      return this
    }

    res.write = function (chunk, enc, cb) {
      size += getChunkSize(chunk, enc)
      if (!started) start()
      if (!compress) return write.apply(this, arguments)
      return compress.write.apply(compress, arguments)
    }

    res.end = function (chunk, enc, cb) {
      if (arguments.length > 0 && typeof chunk !== 'function') {
        size += getChunkSize(chunk, enc)
      }
      if (!started) start()
      if (!compress) return end.apply(this, arguments)
      return compress.end.apply(compress, arguments)
    }

    res.on = function (type, listener) {
      if (!pendingListeners || type !== 'drain') on.call(this, type, listener)
      else if (compress) compress.on(type, listener)
      else pendingListeners.push([type, listener])
      return this
    }

    next()
  }
}
