import { DevRuntime } from 'rolldown/experimental/runtime'
import { describe, expect, test, vi } from 'vitest'
import type { BundledDevUpdatePayload, HotPayload } from '#types/hmrPayload'
import { BundledDevHMRClient, BundledDevHMRContext } from '../bundledDevHmr'
import type { NormalizedModuleRunnerTransport } from '../moduleRunnerTransport'

const EPOCH = 7

/**
 * A page that ran the full build `main -> dep` (numbers 0 and 1), where `dep`
 * accepts itself. `importPatch` answers each request with `respond`. With
 * `beforeOutput`, the page has not run the full build yet: `runOutput` runs it.
 */
function setup({ beforeOutput = false } = {}) {
  const sent: HotPayload[] = []
  const transport: NormalizedModuleRunnerTransport = {
    send: async (payload) => {
      sent.push(payload)
    },
    invoke: async () => {
      throw new Error('unused')
    },
  }
  const runtime = new DevRuntime()
  const requests: URLSearchParams[] = []
  let respond: (request: URLSearchParams) => void = () => {}
  runtime.importPatch = async (url: string) => {
    const request = new URLSearchParams(url.slice(url.indexOf('?') + 1))
    requests.push(request)
    respond(request)
  }
  const client = new BundledDevHMRClient(
    { error: () => {}, debug: () => {} },
    transport,
    runtime,
    { partialAccept: false, beforeApply: () => 'continue' },
  )
  runtime.hooks = {
    createModuleHotContext: (id: string) =>
      new BundledDevHMRContext(client, id),
    onModuleCacheRemoval: (id: string) => client.handleModuleCacheRemoval(id),
    onMissingFactory: (id: string) => client.handleMissingFactory(id),
    onReloadNeeded: (reason: string) => client.handleReloadNeeded(reason),
    onCaughtUp: () => client.catchUpMissedUpdates(),
  }

  const accepted: unknown[] = []
  const runOutput = () => {
    runtime.registerGraph({
      ids: ['main', 'dep'],
      localCount: 2,
      edges: [[1], []],
      nums: [0, 1],
      epoch: EPOCH,
      entries: [0],
    })
    runtime.registerModule('dep', { exports: { value: 0 } })
    runtime.registerModule('main', { exports: {} })
    new BundledDevHMRContext(client, 'dep').accept((mod: unknown) =>
      accepted.push(mod),
    )
  }
  if (!beforeOutput) runOutput()

  /** What a patch rendered at `gen` runs first */
  const payload = (gen: number) => runtime.beginPayload(gen)

  /** The rows and the factory of `dep` in a patch rendered at `gen` */
  const shipDep = (gen: number, value: number, scope = payload(gen)) => {
    scope.registerGraph({ ids: ['dep'], localCount: 1, edges: [[]], nums: [1] })
    scope.registerFactory('dep', (id) =>
      runtime.registerModule(id, { exports: { value } }),
    )
  }

  const settle = () =>
    (client as unknown as { applyQueue: Promise<void> }).applyQueue
  let seq = 0
  const push = (update: Omit<BundledDevUpdatePayload, 'type' | 'seq'>) => {
    client.handlePush({ type: 'bundled-dev-update', seq: ++seq, ...update })
    return settle()
  }

  const reloadReasons = () =>
    sent.flatMap((payload) =>
      payload.type === 'custom' &&
      payload.event === 'vite:bundled-dev:reload-needed'
        ? [payload.data.reason as string]
        : [],
    )

  return {
    runtime,
    client,
    runOutput,
    requests,
    accepted,
    payload,
    shipDep,
    push,
    settle,
    reloadReasons,
    setRespond: (fn: typeof respond) => {
      respond = fn
    },
  }
}

describe('BundledDevHMRClient', () => {
  test('requests the code of the update and applies it', async () => {
    const t = setup()
    t.setRespond(() => t.shipDep(1, 1))

    await t.push({ changedIds: ['dep'], staleIds: ['dep'], gen: 1 })

    expect(t.requests).toHaveLength(1)
    const [request] = t.requests
    expect(request.get('s')).toBe(String(EPOCH))
    expect(request.get('g')).toBe('1')
    // `u` is {1} (dep), `e` is {0} (main)
    expect(request.get('u')).toBe('bAg')
    expect(request.get('e')).toBe('bAQ')
    expect(t.accepted).toStrictEqual([{ value: 1 }])
    expect(t.runtime.appliedGen).toBe(1)
    expect(t.reloadReasons()).toStrictEqual([])
  })

  test('ignores an update of modules the page never ran', async () => {
    const t = setup()

    await t.push({ changedIds: ['lazy'], staleIds: ['lazy'], gen: 1 })

    expect(t.requests).toHaveLength(0)
    expect(t.runtime.appliedGen).toBe(1)
    expect(t.reloadReasons()).toStrictEqual([])
  })

  test('does not request code it holds', async () => {
    const t = setup()
    t.shipDep(1, 1)

    await t.push({ changedIds: ['dep'], staleIds: [], gen: 1 })

    expect(t.requests).toHaveLength(0)
    expect(t.accepted).toStrictEqual([{ value: 1 }])
  })

  test('drops a factory that the update made stale', async () => {
    const t = setup()
    // a page that loaded the output of gen 1 and got `dep` of gen 1
    t.runtime.setOutputGeneration(1)
    t.shipDep(1, 1)
    t.setRespond(() => t.shipDep(2, 2))

    await t.push({ changedIds: ['dep'], staleIds: ['dep'], gen: 2 })

    expect(t.requests).toHaveLength(1)
    expect(t.accepted).toStrictEqual([{ value: 2 }])
  })

  test('only marks modules stale for an update a catch-up already applied', async () => {
    const t = setup()
    t.runtime.appliedGen = t.runtime.knownGen = 3
    t.shipDep(3, 3)

    await t.push({ changedIds: ['dep'], staleIds: ['dep'], gen: 2 })

    expect(t.requests).toHaveLength(0)
    expect(t.accepted).toStrictEqual([])
    expect(t.runtime.hasFactory('dep')).toBe(true)
  })

  test('walks again with the changes of a catch-up', async () => {
    const t = setup()
    t.runtime.registerGraph({
      ids: ['other'],
      localCount: 1,
      edges: [[]],
      nums: [2],
      epoch: EPOCH,
    })
    t.runtime.registerModule('other', { exports: {} })
    const acceptedOther: unknown[] = []
    new BundledDevHMRContext(t.client, 'other').accept((mod: unknown) =>
      acceptedOther.push(mod),
    )
    t.setRespond((request) => {
      if (t.requests.length === 1) {
        // the server is at gen 2: `other` changed at gen 2
        const scope = t.payload(2)
        scope.catchUp([{ gen: 2, changedIds: ['other'], staleIds: ['other'] }])
        t.shipDep(2, 2, scope)
      } else {
        expect(request.get('g')).toBe('2')
        const scope = t.payload(2)
        scope.registerGraph({
          ids: ['other'],
          localCount: 1,
          edges: [[]],
          nums: [2],
        })
        scope.registerFactory('other', (id) =>
          t.runtime.registerModule(id, { exports: { other: 2 } }),
        )
      }
    })

    await t.push({ changedIds: ['dep'], staleIds: ['dep'], gen: 1 })

    expect(t.requests).toHaveLength(2)
    expect(t.accepted).toStrictEqual([{ value: 2 }])
    expect(acceptedOther).toStrictEqual([{ other: 2 }])
    expect(t.runtime.appliedGen).toBe(2)

    // the push of gen 2 arrives after its changes were applied
    await t.push({ changedIds: ['other'], staleIds: ['other'], gen: 2 })
    expect(t.requests).toHaveLength(2)
    expect(acceptedOther).toHaveLength(1)
    expect(t.reloadReasons()).toStrictEqual([])
  })

  test('requests a full reload when the request fails', async () => {
    const t = setup()
    t.setRespond(() => {
      throw new Error('500')
    })

    await t.push({ changedIds: ['dep'], staleIds: ['dep'], gen: 1 })

    expect(t.accepted).toStrictEqual([])
    expect(t.runtime.isExecuted('dep')).toBe(true)
    expect(t.reloadReasons()).toStrictEqual([
      'failed to request the hmr patch: Error: 500',
    ])
  })

  test('requests a full reload when the server answers with a reload', async () => {
    const t = setup()
    // what the body of a reload answer runs
    t.setRespond(() => t.runtime.reloadNeeded('the epoch does not match'))

    await t.push({ changedIds: ['dep'], staleIds: ['dep'], gen: 1 })

    expect(t.requests).toHaveLength(1)
    expect(t.accepted).toStrictEqual([])
    expect(t.runtime.isExecuted('dep')).toBe(true)
    expect(t.reloadReasons()).toStrictEqual(['the epoch does not match'])
  })

  test('requests a full reload when the code is still missing', async () => {
    const t = setup()

    await t.push({ changedIds: ['dep'], staleIds: ['dep'], gen: 1 })

    expect(t.requests).toHaveLength(2)
    expect(t.runtime.isExecuted('dep')).toBe(true)
    expect(t.reloadReasons()).toStrictEqual([
      'no factory for dep after 2 requests',
    ])
  })

  test('requests a full reload on a sequence gap', async () => {
    const t = setup()
    t.client.handlePush({
      type: 'bundled-dev-update',
      changedIds: ['dep'],
      staleIds: ['dep'],
      gen: 1,
      seq: 2,
    })
    await t.settle()

    expect(t.requests).toHaveLength(0)
    expect(t.reloadReasons()).toStrictEqual([
      'hmr update sequence gap (expected 1, got 2)',
    ])
  })

  test('requests the importer that `invalidate()` runs again', async () => {
    const t = setup()
    // main -> mid -> dep, and main accepts mid
    t.runtime.registerGraph({
      ids: ['main', 'mid', 'dep'],
      localCount: 2,
      edges: [[1], [2]],
      nums: [0, 2],
      epoch: EPOCH,
      entries: [0],
    })
    t.runtime.registerModule('mid', { exports: { mid: 0 } })
    const midAccepted = vi.fn()
    new BundledDevHMRContext(t.client, 'main').accept('mid', midAccepted)
    t.setRespond(() => {
      const scope = t.payload(0)
      scope.registerGraph({
        ids: ['mid', 'dep'],
        localCount: 1,
        edges: [[1]],
        nums: [2],
      })
      scope.registerFactory('mid', (id) =>
        t.runtime.registerModule(id, { exports: { mid: 1 } }),
      )
    })

    new BundledDevHMRContext(t.client, 'dep').invalidate('test')
    await t.settle()

    expect(t.requests).toHaveLength(1)
    // `u` is {2} (mid)
    expect(t.requests[0].get('u')).toBe('bBA')
    expect(midAccepted).toHaveBeenCalledWith({ mid: 1 })
    expect(t.runtime.isExecuted('dep')).toBe(true)
    expect(t.reloadReasons()).toStrictEqual([])
  })

  test('walks again when a module that imports the update ran during the request', async () => {
    const t = setup()
    // main -> app -> x, where app accepts itself. A lazy module `lazy` imports x
    // and accepts itself, and runs while the request is on the way.
    t.runtime.registerGraph({
      ids: ['main', 'app', 'x'],
      localCount: 3,
      edges: [[1], [2], []],
      nums: [0, 2, 3],
      epoch: EPOCH,
      entries: [0],
    })
    t.runtime.registerModule('x', { exports: { x: 0 } })
    t.runtime.registerModule('app', { exports: {} })
    new BundledDevHMRContext(t.client, 'app').accept()
    const seenByLazy: unknown[] = []
    new BundledDevHMRContext(t.client, 'lazy').accept()
    const shipX = (gen: number, value: number) => {
      const scope = t.payload(gen)
      scope.registerGraph({
        ids: ['x', 'app'],
        localCount: 2,
        edges: [[], [0]],
        nums: [3, 2],
      })
      scope.registerFactory('x', (id) =>
        t.runtime.registerModule(id, { exports: { x: value } }),
      )
      scope.registerFactory('app', (id) => {
        t.runtime.registerModule(id, { exports: {} })
        t.runtime.initModule('x')
      })
    }
    t.setRespond(() => {
      shipX(1, 1)
      // the lazy chunk, rendered before the update, lands and its module runs
      const lazyScope = t.payload(0)
      lazyScope.registerGraph({
        ids: ['lazy', 'x'],
        localCount: 1,
        edges: [[1]],
        nums: [4, 3],
      })
      lazyScope.registerFactory('lazy', (id) => {
        t.runtime.registerModule(id, { exports: {} })
        seenByLazy.push(t.runtime.loadExports('x'))
      })
      t.runtime.initModule('lazy')
    })

    await t.push({ changedIds: ['x'], staleIds: ['x'], gen: 1 })

    expect(t.requests).toHaveLength(1)
    expect(seenByLazy).toStrictEqual([{ x: 0 }, { x: 1 }])
    expect(t.reloadReasons()).toStrictEqual([])
  })

  test('prepares the update again when a catch-up drops its code before the apply', async () => {
    const t = setup()
    let caughtUp = false
    new BundledDevHMRContext(t.client, 'main').on(
      'vite:beforeUpdate',
      async () => {
        if (caughtUp) return
        caughtUp = true
        // a lazy chunk requested before the push lands: dep changed again at gen 2
        t.payload(2).catchUp([
          { gen: 2, changedIds: ['dep'], staleIds: ['dep'] },
        ])
      },
    )
    t.setRespond(() =>
      t.requests.length === 1 ? t.shipDep(1, 1) : t.shipDep(2, 2),
    )

    await t.push({ changedIds: ['dep'], staleIds: ['dep'], gen: 1 })

    expect(t.requests).toHaveLength(2)
    expect(t.requests[1].get('g')).toBe('2')
    expect(t.accepted).toStrictEqual([{ value: 2 }])
    expect(t.runtime.appliedGen).toBe(2)
    expect(t.reloadReasons()).toStrictEqual([])
  })

  test('applies a new edit of the module that called `invalidate()` as a normal update', async () => {
    const t = setup()
    // main -> mid -> dep, where main accepts mid and dep accepts itself
    t.runtime.registerGraph({
      ids: ['main', 'mid', 'dep'],
      localCount: 2,
      edges: [[1], [2]],
      nums: [0, 2],
      epoch: EPOCH,
      entries: [0],
    })
    t.runtime.registerModule('mid', { exports: { mid: 0 } })
    const midAccepted = vi.fn()
    new BundledDevHMRContext(t.client, 'main').accept('mid', midAccepted)
    t.setRespond(() => {
      // dep was saved again while the request was on the way
      const scope = t.payload(1)
      scope.catchUp([{ gen: 1, changedIds: ['dep'], staleIds: ['dep'] }])
      scope.registerGraph({
        ids: ['mid', 'dep'],
        localCount: 1,
        edges: [[1]],
        nums: [2, 1],
      })
      scope.registerFactory('mid', (id) => {
        t.runtime.registerModule(id, { exports: { mid: 1 } })
        t.runtime.initModule('dep')
      })
      t.shipDep(1, 1, scope)
    })

    // a new context clears the callbacks of its module, so accept again
    const depHot = new BundledDevHMRContext(t.client, 'dep')
    depHot.accept((mod: unknown) => t.accepted.push(mod))
    depHot.invalidate('test')
    await t.settle()

    expect(t.requests).toHaveLength(1)
    expect(midAccepted).toHaveBeenCalledWith({ mid: 1 })
    expect(t.accepted).toStrictEqual([{ value: 1 }])
    expect(t.runtime.appliedGen).toBe(1)
    expect(t.reloadReasons()).toStrictEqual([])
  })

  test('asks for the update it missed when a push skips a generation', async () => {
    const t = setup()
    t.setRespond((request) => {
      // the client heard of nothing after gen 0
      expect(request.get('g')).toBe('0')
      const scope = t.payload(2)
      scope.catchUp([
        { gen: 1, changedIds: ['dep'], staleIds: ['dep'] },
        { gen: 2, changedIds: ['other'], staleIds: ['other'] },
      ])
      t.shipDep(2, 2, scope)
    })

    // the push of gen 1 went out before this page connected
    await t.push({ changedIds: ['other'], staleIds: ['other'], gen: 2 })

    expect(t.requests).toHaveLength(1)
    expect(t.accepted).toStrictEqual([{ value: 2 }])
    expect(t.runtime.knownGen).toBe(2)
    expect(t.runtime.appliedGen).toBe(2)
    expect(t.reloadReasons()).toStrictEqual([])
  })

  test('pulls an update that was pushed before the page ran its output', async () => {
    const t = setup({ beforeOutput: true })
    t.setRespond((request) => {
      if (t.requests.length === 1) {
        expect(request.get('g')).toBe('0')
        t.payload(1).catchUp([
          { gen: 1, changedIds: ['dep'], staleIds: ['dep'] },
        ])
      } else {
        t.shipDep(1, 1)
      }
    })
    t.runtime.setOutputGeneration(0)

    // the output of gen 0 still loads
    await t.push({ changedIds: ['dep'], staleIds: ['dep'], gen: 1 })
    expect(t.requests).toHaveLength(0)
    expect(t.runtime.knownGen).toBe(0)
    expect(t.runtime.appliedGen).toBe(0)

    t.runOutput()
    t.client.catchUpMissedUpdates()
    await t.settle()

    expect(t.requests).toHaveLength(2)
    expect(t.accepted).toStrictEqual([{ value: 1 }])
    expect(t.runtime.appliedGen).toBe(1)
    expect(t.reloadReasons()).toStrictEqual([])

    // nothing was missed, so nothing is pulled
    t.client.catchUpMissedUpdates()
    await t.settle()
    expect(t.requests).toHaveLength(2)
  })

  test('requests a full reload when the server cannot bring a missed update', async () => {
    const t = setup()
    // an engine full reload at gen 1 sends no push
    t.setRespond(() =>
      t.runtime.reloadNeeded('generation 0 is too old to catch up'),
    )

    await t.push({ changedIds: ['dep'], staleIds: ['dep'], gen: 2 })

    expect(t.requests).toHaveLength(1)
    expect(t.accepted).toStrictEqual([])
    expect(t.reloadReasons()).toStrictEqual([
      'generation 0 is too old to catch up',
    ])
  })

  test('applies the changes of a catch-up that came with a lazy load', async () => {
    const t = setup()
    // `main` has an `import()` of `route`, so `route` has a number
    t.runtime.registerGraph({
      ids: ['route'],
      localCount: 0,
      edges: [],
      nums: [2],
    })
    t.setRespond((request) => {
      if (!request.has('l')) {
        expect(request.get('g')).toBe('1')
        t.shipDep(1, 1)
        return
      }
      // `l` is {2} (route)
      expect(request.get('l')).toBe('bBA')
      // `dep` changed at gen 1, and its push did not reach this page yet
      const scope = t.payload(1)
      scope.catchUp([{ gen: 1, changedIds: ['dep'], staleIds: ['dep'] }])
      scope.registerGraph({
        ids: ['route'],
        localCount: 1,
        edges: [[]],
        nums: [2],
      })
      scope.registerFactory('route', (id) =>
        t.runtime.registerModule(id, { exports: {} }),
      )
    })

    await t.runtime.requestLazy('route')
    await t.settle()

    expect(t.requests).toHaveLength(2)
    expect(t.accepted).toStrictEqual([{ value: 1 }])
    expect(t.runtime.appliedGen).toBe(1)
    expect(t.reloadReasons()).toStrictEqual([])
  })

  test('pulls a dropped factory of a module that did not run after the update', async () => {
    const t = setup()
    // `dep` requires `lazyDep` inside a function, so `lazyDep` did not run
    t.runtime.registerGraph({
      ids: ['dep', 'lazyDep'],
      localCount: 2,
      edges: [[1], []],
      nums: [1, 2],
      epoch: EPOCH,
    })
    // a patch of gen 0 carried `lazyDep`
    t.payload(0).registerFactory('lazyDep', () => {})
    t.setRespond((request) => {
      // {2}: `lazyDep`
      expect(request.get('u')).toBe('bBA')
      t.payload(1).registerFactory('lazyDep', () => {})
    })

    await t.push({ changedIds: ['lazyDep'], staleIds: ['lazyDep'], gen: 1 })
    await t.runtime.refetchDropped()

    expect(t.requests).toHaveLength(1)
    expect(t.runtime.hasFactory('lazyDep')).toBe(true)
    expect(t.accepted).toStrictEqual([])
    expect(t.reloadReasons()).toStrictEqual([])
  })
})
