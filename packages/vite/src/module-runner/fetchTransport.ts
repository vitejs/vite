/* eslint-disable n/no-unsupported-features/node-builtins */
import type { ModuleRunnerTransport } from '../shared/moduleRunnerTransport'

export function createClientFetchTransport(
  environmentName: string,
  url: string,
): ModuleRunnerTransport {
  let sseClient: Awaited<ReturnType<typeof createSSEClient>>

  return {
    async connect(handlers) {
      sseClient = await createSSEClient(
        environmentName,
        url + '/@vite/transport',
        handlers,
      )
    },
    async disconnect() {
      // TODO
    },
    async send(payload) {
      if (!sseClient) throw new Error('not connected')
      sseClient.send(payload)
    },
  }
}

async function createSSEClient(
  environmentName: string,
  url: string,
  handlers: {
    onMessage: (payload: any) => void
    onDisconnection: () => void
  },
) {
  const response = await fetch(url, {
    headers: {
      'x-vite-environment': environmentName,
    },
  })
  if (!response.ok) throw new Error('failed to connect')

  const clientId = response.headers.get('x-client-id')
  if (!clientId) throw new Error('invalid connect response')
  if (!response.body) throw new Error('invalid connect response')

  response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(splitTransform('\n\n'))
    .pipeTo(
      new WritableStream({
        write(chunk) {
          if (chunk.startsWith('data: ')) {
            const payload = JSON.parse(chunk.slice('data: '.length))
            handlers.onMessage(payload)
          }
        },
        close() {
          handlers.onDisconnection()
        },
      }),
    )
    // TODO
    .catch(() => {})

  return {
    send: async (payload: unknown) => {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'x-vite-environment': environmentName,
          'x-client-id': clientId,
        },
      })
      if (!response.ok) throw new Error('invalid send response')
      const result = await response.json()
      return result
    },
  }
}

function splitTransform(sep: string): TransformStream<string, string> {
  let pending = ''
  return new TransformStream({
    transform(chunk, controller) {
      while (true) {
        const i = chunk.indexOf(sep)
        if (i >= 0) {
          pending += chunk.slice(0, i)
          controller.enqueue(pending)
          pending = ''
          chunk = chunk.slice(i + sep.length)
          continue
        }
        pending += chunk
        break
      }
    },
  })
}
