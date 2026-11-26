import path from 'node:path'
import { Miniflare, convertV4MiniflareOptions } from 'miniflare'

const isTest = !!process.env.TEST

export async function createServer(port) {
  const mf = new Miniflare(
    convertV4MiniflareOptions({
      scriptPath: path.resolve(
        import.meta.dirname,
        'dist/worker/entry-worker.js',
      ),
      port,
      modules: true,
      compatibilityFlags: ['nodejs_compat'],
    }),
  )
  await mf.ready
  return { mf }
}

if (!isTest) {
  createServer(5173).then(() => console.log('http://localhost:5173'))
}
