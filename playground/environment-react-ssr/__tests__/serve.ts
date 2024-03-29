import type { ExecaChildProcess } from 'execa'
import { $ as $_ } from 'execa'
import { isBuild, page } from '~utils'

const $ = $_({
  cwd: new URL('..', import.meta.url),
  // stdio: "inherit",
  // verbose: true,
  env: {
    NO_COLOR: '1',
  },
})

export async function serve() {
  if (isBuild) {
    await $`pnpm build`
    return setupWebServer($`pnpm preview`)
  } else {
    return setupWebServer($`pnpm dev`)
  }
}

async function setupWebServer(proc: ExecaChildProcess<string>) {
  const waitExit = createDefer<void>()
  proc.on('exit', () => waitExit.resolve())

  // wait for output such as
  //   Local:   http://localhost:4173/
  const waitUrl = createDefer<string>()
  let output = ''
  proc.stdout.on('data', (data) => {
    output += String(data)
    const m = output.match(/Local: {3}(http.*)/)
    if (m && m[1]) {
      waitUrl.resolve(m[1])
    }
  })

  const url = await waitUrl.promise
  await page.goto(url)

  return {
    close: async () => {
      proc.kill()
      await waitExit.promise
    },
  }
}

function createDefer<T>() {
  let resolve: (v: T) => void
  let reject: (v: unknown) => void
  const promise = new Promise<T>((resolve_, reject_) => {
    resolve = resolve_
    reject = reject_
  })
  return { promise, resolve, reject }
}
