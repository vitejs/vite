import { performance } from 'node:perf_hooks'
import type { Connect } from 'dep-types/connect'
import { removeTimestampQuery } from './utils'

interface Metric {
  startUp?: number
  scan?: number
  prebundle?: number
  loadConfig?: number
  initTsconfck?: number
  middleware?: Record<string, Record<string, number>>
}

export class VitePerf {
  metric: Metric = {}
  enabled: boolean = false

  collect(
    metric: keyof Metric | string,
    start = global.__vite_start_time,
    end?: number,
  ): void {
    if (!this.enabled || !start) {
      return
    }

    const duration = Math.ceil((end ?? performance.now()) - start)

    if (metric.includes('::')) {
      const paths = metric.split('::')
      paths.reduce((obj: any, m, index) => {
        if (index === paths.length - 1) {
          obj[m] = duration
        } else {
          obj[m] ??= {}
        }

        return obj[m]
      }, this.metric)
    } else {
      ;(this.metric[metric as keyof Metric] as number) = duration
    }
  }

  collectMiddleware(
    name: string,
    middleware: Connect.NextHandleFunction,
  ): Connect.NextHandleFunction {
    if (!this.enabled) {
      return middleware
    }
    return (req, res, next) => {
      const start = performance.now()
      const end = res.end
      res.end = (...args: readonly [any, any?, any?]) => {
        this.collect(
          `middleware::${removeTimestampQuery(req.url!)}::${name}`,
          start,
        )
        return end.call(res, ...args)
      }
      const perfNext = () => {
        this.collect(`middleware::${req.url!}::${name}`, start)
        next()
      }
      return middleware(req, res, perfNext)
    }
  }
}

export default new VitePerf()
