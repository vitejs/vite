import unusedUrlImport from './unused-url-import.txt?url'

export const unusedUrl = new URL('./unused.txt', import.meta.url).href
export { unusedUrlImport }
