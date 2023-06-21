import os from 'node:os'
import { Worker as _Worker } from 'node:worker_threads'

interface NodeWorker extends _Worker {
  currentResolve: ((value: any) => void) | null
  currentReject: ((err: Error) => void) | null
}

export interface Options {
  max?: number
  parentFunctions?: Record<string, (...args: any[]) => Promise<any>>
}

export class Worker<Args extends any[], Ret = any> {
  private code: string
  private parentFunctions: Record<string, (...args: any[]) => Promise<any>>
  private max: number
  private pool: NodeWorker[]
  private idlePool: NodeWorker[]
  private queue: [(worker: NodeWorker) => void, (err: Error) => void][]

  constructor(
    fn: (...args: Args) => Promise<Ret> | Ret,
    options: Options = {},
  ) {
    this.code = genWorkerCode(fn, options.parentFunctions ?? {})
    this.parentFunctions = options.parentFunctions ?? {}
    this.max = options.max || Math.max(1, os.cpus().length - 1)
    this.pool = []
    this.idlePool = []
    this.queue = []
  }

  async run(...args: Args): Promise<Ret> {
    const worker = await this._getAvailableWorker()
    return new Promise<Ret>((resolve, reject) => {
      worker.currentResolve = resolve
      worker.currentReject = reject
      worker.postMessage({ type: 'run', args })
    })
  }

  stop(): void {
    this.pool.forEach((w) => w.unref())
    this.queue.forEach(([_, reject]) =>
      reject(
        new Error('Main worker pool stopped before a worker was available.'),
      ),
    )
    this.pool = []
    this.idlePool = []
    this.queue = []
  }

  private async _getAvailableWorker(): Promise<NodeWorker> {
    // has idle one?
    if (this.idlePool.length) {
      return this.idlePool.shift()!
    }

    // can spawn more?
    if (this.pool.length < this.max) {
      const worker = new _Worker(this.code, { eval: true }) as NodeWorker

      worker.on('message', async (args) => {
        if (args.type === 'run') {
          if ('result' in args) {
            worker.currentResolve && worker.currentResolve(args.result)
            worker.currentResolve = null
            this._assignDoneWorker(worker)
          } else {
            worker.currentReject && worker.currentReject(args.error)
            worker.currentReject = null
          }
        } else if (args.type === 'parentFunction') {
          if (!(args.name in this.parentFunctions)) {
            throw new Error(
              `Parent function ${JSON.stringify(
                args.name,
              )} was not passed to options but was called.`,
            )
          }

          try {
            const result = await this.parentFunctions[args.name](...args.args)
            worker.postMessage({ type: 'parentFunction', id: args.id, result })
          } catch (e) {
            worker.postMessage({
              type: 'parentFunction',
              id: args.id,
              error: e,
            })
          }
        }
      })

      worker.on('error', (err) => {
        worker.currentReject && worker.currentReject(err)
        worker.currentReject = null
      })

      worker.on('exit', (code) => {
        const i = this.pool.indexOf(worker)
        if (i > -1) this.pool.splice(i, 1)
        if (code !== 0 && worker.currentReject) {
          worker.currentReject(
            new Error(`Worker stopped with non-0 exit code ${code}`),
          )
          worker.currentReject = null
        }
      })

      this.pool.push(worker)
      return worker
    }

    // no one is available, we have to wait
    let resolve: (worker: NodeWorker) => void
    let reject: (err: Error) => any
    const onWorkerAvailablePromise = new Promise<NodeWorker>((r, rj) => {
      resolve = r
      reject = rj
    })
    this.queue.push([resolve!, reject!])
    return onWorkerAvailablePromise
  }

  private _assignDoneWorker(worker: NodeWorker) {
    // someone's waiting already?
    if (this.queue.length) {
      const [resolve] = this.queue.shift()!
      resolve(worker)
      return
    }
    // take a rest.
    this.idlePool.push(worker)
  }
}

function genWorkerCode(fn: Function, parentFunctions: Record<string, unknown>) {
  return `
let id = 0
const parentFunctionResolvers = new Map()
const parentFunctionCall = (key) => async (...args) => {
  id++
  let resolve, reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  parentFunctionResolvers.set(id, { resolve, reject })

  parentPort.postMessage({ type: 'parentFunction', id, name: key, args })
  return await promise
}

const doWork = (() => {
  ${Object.keys(parentFunctions)
    .map((key) => `const ${key} = parentFunctionCall(${JSON.stringify(key)});`)
    .join('\n')}
  return ${fn.toString()}
})()

const { parentPort } = require('worker_threads')

parentPort.on('message', async (args) => {
  if (args.type === 'run') {
    try {
      const res = await doWork(...args.args)
      parentPort.postMessage({ type: 'run', result: res })
    } catch (e) {
      parentPort.postMessage({ type: 'run', error: e })
    }
  } else if (args.type === 'parentFunction') {
    if (parentFunctionResolvers.has(id)) {
      const { resolve, reject } = parentFunctionResolvers.get(id)
      parentFunctionResolvers.delete(id)

      if ('result' in args) {
        resolve(args.result)
      } else {
        reject(args.error)
      }
    }
  }
})
  `
}
