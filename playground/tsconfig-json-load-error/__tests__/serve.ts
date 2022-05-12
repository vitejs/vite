import { startDefaultServe } from '~utils'

export let serveError: Error | undefined

export async function serve() {
  try {
    await startDefaultServe()
  } catch (e) {
    serveError = e
  }
}

export function clearServeError() {
  serveError = undefined
}

afterAll(() => {
  if (serveError) {
    throw serveError
  }
})
