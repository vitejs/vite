import type { DevEnvironment } from './environment'

export class RemoteEnvironmentTransport {
  constructor(
    private readonly options: {
      send: (data: any) => void
      onMessage: (handler: (data: any) => void) => void
    },
  ) {}

  register(environment: DevEnvironment): void {
    this.options.onMessage(async (data) => {
      if (typeof data !== 'object' || !data || !data.__v) return

      const method = data.m as 'fetchModule'
      const parameters = data.a as [string, string]

      try {
        const result = await environment[method](...parameters)
        this.options.send({
          __v: true,
          r: result,
          i: data.i,
        })
      } catch (error) {
        this.options.send({
          __v: true,
          e: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          i: data.i,
        })
      }
    })
  }
}
