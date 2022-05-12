import { startDefaultServe } from '~utils'

export let serveError: Error | undefined

export async function serve(root: string, isBuild: boolean) {
  try {
    await startDefaultServe(root, isBuild)
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
