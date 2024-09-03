import { workerDep } from './worker-dep.js'

async function main() {
  const { workerDepDynamic } = await import('./worker-dep-dynamic.js')
  self.postMessage({
    ok: true,
    location: self.location.href,
    image: new URL('./vite.svg', import.meta.url).href,
    workerDep,
    workerDepDynamic,
  })
}

main()
