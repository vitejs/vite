import type { Plugin } from 'vite'

import type { GetManualChunk } from 'rollup'

export class SplitVendorChunkCache {}

export function splitVendorChunk(options?: {
  cache?: SplitVendorChunkCache
}): GetManualChunk

export function splitVendorPlugin(): Plugin
