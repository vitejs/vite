import { AsyncLocalStorage } from 'node:async_hooks'
import { tracingChannel } from 'node:diagnostics_channel'
import { describe, expect, onTestFinished, test } from 'vitest'
import type { Plugin } from '../../plugin'
import { createServer } from '../index'
import type { ModuleTraceContext, PluginTraceContext } from '../tracing'

const pluginChannel = tracingChannel<unknown, PluginTraceContext>('vite.plugin')
const moduleChannel = tracingChannel<unknown, ModuleTraceContext>('vite.module')

async function createTestServer(plugin: Plugin) {
  const server = await createServer({
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true, ws: false },
    plugins: [plugin],
  })
  onTestFinished(() => server.close())
  return server
}

describe('tracing channels', () => {
  test('runs plugin spans within the module span', async () => {
    const store = new AsyncLocalStorage<string>()
    moduleChannel.start.bindStore(store, (ctx) => ctx.url)
    onTestFinished(() => {
      moduleChannel.start.unbindStore(store)
    })

    const events: string[] = []
    const onModuleStart = (ctx: ModuleTraceContext) =>
      events.push(`module:start ${ctx.environment} ${ctx.url}`)
    const onModuleEnd = (ctx: ModuleTraceContext) =>
      events.push(`module:end ${ctx.url}`)
    const onPluginStart = (ctx: PluginTraceContext) => {
      if (ctx.plugin === 'test') {
        events.push(
          `${ctx.hook} ${ctx.id} ${ctx.environment} in ${store.getStore()}`,
        )
      }
    }
    moduleChannel.start.subscribe(onModuleStart)
    moduleChannel.asyncEnd.subscribe(onModuleEnd)
    pluginChannel.start.subscribe(onPluginStart)
    onTestFinished(() => {
      moduleChannel.start.unsubscribe(onModuleStart)
      moduleChannel.asyncEnd.unsubscribe(onModuleEnd)
      pluginChannel.start.unsubscribe(onPluginStart)
    })

    const server = await createTestServer({
      name: 'test',
      resolveId(id) {
        if (id.startsWith('virtual:')) return '\0' + id
      },
      async load(id) {
        if (id === '\0virtual:entry') return `import 'virtual:dep'`
        if (id === '\0virtual:dep') return 'export default 1'
      },
      transform(code, id) {
        if (id === '\0virtual:entry') return code
      },
    })
    await server.environments.client.transformRequest('virtual:entry')

    const entryEvents = events.filter((e) => e.endsWith(' virtual:entry'))
    expect(entryEvents[0]).toBe('module:start client virtual:entry')
    expect(entryEvents.at(-1)).toBe('module:end virtual:entry')
    expect(entryEvents).toEqual(
      expect.arrayContaining([
        'resolveId virtual:entry client in virtual:entry',
        'load \0virtual:entry client in virtual:entry',
        'transform \0virtual:entry client in virtual:entry',
        'resolveId virtual:dep client in virtual:entry',
      ]),
    )
  })

  test('publishes errors thrown by plugin hooks', async () => {
    const errors: string[] = []
    const onError = (ctx: PluginTraceContext & { error: Error }) =>
      errors.push(`${ctx.plugin} ${ctx.hook} ${ctx.error.message}`)
    pluginChannel.error.subscribe(onError)
    onTestFinished(() => pluginChannel.error.unsubscribe(onError))

    const server = await createTestServer({
      name: 'test',
      resolveId(id) {
        if (id === 'virtual:throws') return '\0' + id
      },
      load(id) {
        if (id === '\0virtual:throws') throw new Error('boom')
      },
    })

    await expect(
      server.environments.client.transformRequest('virtual:throws'),
    ).rejects.toThrow('boom')
    expect(errors).toEqual(['test load boom'])
  })
})
