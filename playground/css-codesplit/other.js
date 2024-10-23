import './style.css'
import './chunk.css'
import chunkCssUrl from './chunk.css?url'

// use this to not treeshake
globalThis.__test_chunkCssUrl = chunkCssUrl
